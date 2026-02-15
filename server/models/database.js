const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

// Ensure data directory exists
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(path.join(dataDir, 'election.db'));

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS elections (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    start_date DATETIME,
    end_date DATETIME,
    status TEXT DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'completed', 'cancelled')),
    created_by TEXT NOT NULL,
    allow_results_view INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES admins(id)
  );

  CREATE TABLE IF NOT EXISTS positions (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    max_votes INTEGER DEFAULT 1,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS candidates (
    id TEXT PRIMARY KEY,
    position_id TEXT NOT NULL,
    election_id TEXT NOT NULL,
    name TEXT NOT NULL,
    bio TEXT,
    photo_url TEXT,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS voters (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL,
    matric_number TEXT NOT NULL,
    voting_code TEXT NOT NULL,
    name TEXT NOT NULL,
    email TEXT,
    department TEXT,
    has_voted INTEGER DEFAULT 0,
    voted_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    UNIQUE(election_id, matric_number)
  );

  CREATE TABLE IF NOT EXISTS votes (
    id TEXT PRIMARY KEY,
    election_id TEXT NOT NULL,
    position_id TEXT NOT NULL,
    candidate_id TEXT NOT NULL,
    voter_id TEXT NOT NULL,
    cast_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (election_id) REFERENCES elections(id) ON DELETE CASCADE,
    FOREIGN KEY (position_id) REFERENCES positions(id) ON DELETE CASCADE,
    FOREIGN KEY (candidate_id) REFERENCES candidates(id) ON DELETE CASCADE,
    FOREIGN KEY (voter_id) REFERENCES voters(id) ON DELETE CASCADE,
    UNIQUE(voter_id, position_id)
  );

  CREATE INDEX IF NOT EXISTS idx_voters_matric ON voters(matric_number);
  CREATE INDEX IF NOT EXISTS idx_voters_election ON voters(election_id);
  CREATE INDEX IF NOT EXISTS idx_votes_election ON votes(election_id);
  CREATE INDEX IF NOT EXISTS idx_votes_candidate ON votes(candidate_id);
  CREATE INDEX IF NOT EXISTS idx_votes_position ON votes(position_id);
  CREATE INDEX IF NOT EXISTS idx_candidates_position ON candidates(position_id);
  CREATE INDEX IF NOT EXISTS idx_positions_election ON positions(election_id);
`);

module.exports = db;
