const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateVoter } = require('../middleware/auth');

const router = express.Router();

// Cast votes
router.post('/', authenticateVoter, (req, res) => {
  try {
    const { votes } = req.body; // Array of { position_id, candidate_id }
    const voterId = req.voter.id;
    const electionId = req.voter.election_id;

    if (!votes || !Array.isArray(votes) || votes.length === 0) {
      return res.status(400).json({ error: 'Votes are required.' });
    }

    // Check if voter has already voted
    const voter = db.prepare('SELECT * FROM voters WHERE id = ? AND election_id = ?').get(voterId, electionId);
    if (!voter) {
      return res.status(404).json({ error: 'Voter not found.' });
    }

    if (voter.has_voted) {
      return res.status(403).json({ error: 'You have already cast your vote.' });
    }

    // Check election is still active
    const election = db.prepare('SELECT * FROM elections WHERE id = ? AND status = ?').get(electionId, 'active');
    if (!election) {
      return res.status(403).json({ error: 'This election is no longer active.' });
    }

    // Validate all positions belong to this election
    const positions = db.prepare('SELECT * FROM positions WHERE election_id = ?').all(electionId);
    const positionIds = new Set(positions.map(p => p.id));

    for (const vote of votes) {
      if (!positionIds.has(vote.position_id)) {
        return res.status(400).json({ error: `Invalid position: ${vote.position_id}` });
      }

      const candidate = db.prepare('SELECT * FROM candidates WHERE id = ? AND position_id = ?').get(vote.candidate_id, vote.position_id);
      if (!candidate) {
        return res.status(400).json({ error: `Invalid candidate for position.` });
      }
    }

    // Check all positions are voted on
    if (votes.length !== positions.length) {
      return res.status(400).json({ error: 'You must vote for all positions.' });
    }

    // Cast all votes in a transaction
    const castVotes = db.transaction(() => {
      for (const vote of votes) {
        const id = uuidv4();
        db.prepare(`
          INSERT INTO votes (id, election_id, position_id, candidate_id, voter_id)
          VALUES (?, ?, ?, ?, ?)
        `).run(id, electionId, vote.position_id, vote.candidate_id, voterId);
      }

      // Mark voter as having voted
      db.prepare('UPDATE voters SET has_voted = 1, voted_at = CURRENT_TIMESTAMP WHERE id = ?').run(voterId);
    });

    castVotes();

    // Broadcast vote update for real-time analytics
    const broadcast = req.app.get('broadcast');
    const results = getElectionResults(electionId);
    broadcast({
      type: 'VOTE_CAST',
      payload: {
        election_id: electionId,
        results,
        timestamp: new Date().toISOString()
      }
    });

    res.json({ message: 'Your vote has been cast successfully! Thank you for voting.' });
  } catch (err) {
    console.error('Cast vote error:', err);
    if (err.message?.includes('UNIQUE constraint')) {
      return res.status(403).json({ error: 'You have already voted for one or more positions.' });
    }
    res.status(500).json({ error: 'Failed to cast vote.' });
  }
});

// Check if voter has voted
router.get('/status', authenticateVoter, (req, res) => {
  try {
    const voter = db.prepare('SELECT has_voted, voted_at FROM voters WHERE id = ?').get(req.voter.id);
    res.json(voter);
  } catch (err) {
    res.status(500).json({ error: 'Failed to check vote status.' });
  }
});

function getElectionResults(electionId) {
  const positions = db.prepare('SELECT * FROM positions WHERE election_id = ? ORDER BY display_order').all(electionId);

  return positions.map(pos => {
    const candidates = db.prepare(`
      SELECT c.id, c.name, c.photo_url,
        (SELECT COUNT(*) FROM votes WHERE candidate_id = c.id) as vote_count
      FROM candidates c WHERE c.position_id = ?
      ORDER BY vote_count DESC
    `).all(pos.id);

    const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);

    return {
      position_id: pos.id,
      position_title: pos.title,
      total_votes: totalVotes,
      candidates: candidates.map(c => ({
        ...c,
        percentage: totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 100 * 10) / 10 : 0
      }))
    };
  });
}

module.exports = router;
