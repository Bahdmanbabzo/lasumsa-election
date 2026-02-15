const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all voters for an election
router.get('/:electionId', authenticateAdmin, (req, res) => {
  try {
    const voters = db.prepare(`
      SELECT id, matric_number, voting_code, name, email, department, has_voted, voted_at, created_at
      FROM voters WHERE election_id = ? ORDER BY created_at DESC
    `).all(req.params.electionId);

    res.json(voters);
  } catch (err) {
    console.error('Get voters error:', err);
    res.status(500).json({ error: 'Failed to fetch voters.' });
  }
});

// Add single voter
router.post('/', authenticateAdmin, (req, res) => {
  try {
    const { election_id, matric_number, name, email, department } = req.body;

    if (!election_id || !matric_number || !name) {
      return res.status(400).json({ error: 'Election ID, matric number, and name are required.' });
    }

    const existing = db.prepare('SELECT id FROM voters WHERE election_id = ? AND matric_number = ?').get(election_id, matric_number.toUpperCase().trim());
    if (existing) {
      return res.status(409).json({ error: 'A voter with this matric number already exists in this election.' });
    }

    const id = uuidv4();
    const voting_code = generateVotingCode();

    db.prepare(`
      INSERT INTO voters (id, election_id, matric_number, voting_code, name, email, department)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, election_id, matric_number.toUpperCase().trim(), voting_code, name, email || '', department || '');

    const voter = db.prepare('SELECT * FROM voters WHERE id = ?').get(id);
    res.status(201).json(voter);
  } catch (err) {
    console.error('Add voter error:', err);
    res.status(500).json({ error: 'Failed to add voter.' });
  }
});

// Bulk add voters
router.post('/bulk', authenticateAdmin, (req, res) => {
  try {
    const { election_id, voters } = req.body;

    if (!election_id || !voters || !Array.isArray(voters) || voters.length === 0) {
      return res.status(400).json({ error: 'Election ID and voters array are required.' });
    }

    const insertStmt = db.prepare(`
      INSERT OR IGNORE INTO voters (id, election_id, matric_number, voting_code, name, email, department)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const results = [];
    const insertMany = db.transaction((voterList) => {
      for (const v of voterList) {
        if (!v.matric_number || !v.name) continue;

        const id = uuidv4();
        const voting_code = generateVotingCode();
        const info = insertStmt.run(
          id, election_id,
          v.matric_number.toUpperCase().trim(),
          voting_code,
          v.name,
          v.email || '',
          v.department || ''
        );

        if (info.changes > 0) {
          results.push({
            id, matric_number: v.matric_number.toUpperCase().trim(),
            voting_code, name: v.name, email: v.email, department: v.department
          });
        }
      }
    });

    insertMany(voters);
    res.status(201).json({ added: results.length, voters: results });
  } catch (err) {
    console.error('Bulk add voters error:', err);
    res.status(500).json({ error: 'Failed to add voters.' });
  }
});

// Delete voter
router.delete('/:id', authenticateAdmin, (req, res) => {
  try {
    const voter = db.prepare('SELECT * FROM voters WHERE id = ?').get(req.params.id);
    if (!voter) return res.status(404).json({ error: 'Voter not found.' });
    if (voter.has_voted) return res.status(400).json({ error: 'Cannot delete a voter who has already voted.' });

    db.prepare('DELETE FROM voters WHERE id = ?').run(req.params.id);
    res.json({ message: 'Voter deleted.' });
  } catch (err) {
    console.error('Delete voter error:', err);
    res.status(500).json({ error: 'Failed to delete voter.' });
  }
});

// Regenerate voting code
router.post('/:id/regenerate-code', authenticateAdmin, (req, res) => {
  try {
    const voter = db.prepare('SELECT * FROM voters WHERE id = ?').get(req.params.id);
    if (!voter) return res.status(404).json({ error: 'Voter not found.' });
    if (voter.has_voted) return res.status(400).json({ error: 'Cannot change code for a voter who has already voted.' });

    const newCode = generateVotingCode();
    db.prepare('UPDATE voters SET voting_code = ? WHERE id = ?').run(newCode, req.params.id);

    res.json({ voting_code: newCode });
  } catch (err) {
    console.error('Regenerate code error:', err);
    res.status(500).json({ error: 'Failed to regenerate code.' });
  }
});

function generateVotingCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'VOTE-';
  for (let i = 0; i < 3; i++) {
    if (i > 0) code += '-';
    for (let j = 0; j < 3; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
  }
  return code;
}

module.exports = router;
