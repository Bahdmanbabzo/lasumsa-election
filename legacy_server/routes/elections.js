const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all elections (admin)
router.get('/', authenticateAdmin, (req, res) => {
  try {
    const elections = db.prepare(`
      SELECT e.*, 
        (SELECT COUNT(*) FROM voters WHERE election_id = e.id) as total_voters,
        (SELECT COUNT(*) FROM voters WHERE election_id = e.id AND has_voted = 1) as votes_cast,
        (SELECT COUNT(*) FROM positions WHERE election_id = e.id) as total_positions,
        (SELECT COUNT(*) FROM candidates WHERE election_id = e.id) as total_candidates
      FROM elections e 
      WHERE e.created_by = ?
      ORDER BY e.created_at DESC
    `).all(req.admin.id);

    res.json(elections);
  } catch (err) {
    console.error('Get elections error:', err);
    res.status(500).json({ error: 'Failed to fetch elections.' });
  }
});

// Get single election with full details
router.get('/:id', authenticateAdmin, (req, res) => {
  try {
    const election = db.prepare('SELECT * FROM elections WHERE id = ? AND created_by = ?').get(req.params.id, req.admin.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    const positions = db.prepare('SELECT * FROM positions WHERE election_id = ? ORDER BY display_order').all(election.id);

    const positionsWithCandidates = positions.map(pos => {
      const candidates = db.prepare('SELECT * FROM candidates WHERE position_id = ? ORDER BY display_order').all(pos.id);
      return { ...pos, candidates };
    });

    const voterStats = db.prepare(`
      SELECT 
        COUNT(*) as total_voters,
        SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) as votes_cast
      FROM voters WHERE election_id = ?
    `).get(election.id);

    res.json({
      ...election,
      positions: positionsWithCandidates,
      voter_stats: voterStats
    });
  } catch (err) {
    console.error('Get election error:', err);
    res.status(500).json({ error: 'Failed to fetch election.' });
  }
});

// Create election
router.post('/', authenticateAdmin, (req, res) => {
  try {
    const { title, description, start_date, end_date } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Election title is required.' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO elections (id, title, description, start_date, end_date, created_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, title, description || '', start_date || null, end_date || null, req.admin.id);

    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(id);
    res.status(201).json(election);
  } catch (err) {
    console.error('Create election error:', err);
    res.status(500).json({ error: 'Failed to create election.' });
  }
});

// Update election
router.put('/:id', authenticateAdmin, (req, res) => {
  try {
    const election = db.prepare('SELECT * FROM elections WHERE id = ? AND created_by = ?').get(req.params.id, req.admin.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    const { title, description, start_date, end_date, status, allow_results_view } = req.body;

    db.prepare(`
      UPDATE elections SET 
        title = COALESCE(?, title),
        description = COALESCE(?, description),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        status = COALESCE(?, status),
        allow_results_view = COALESCE(?, allow_results_view),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(title, description, start_date, end_date, status, allow_results_view, req.params.id);

    const updated = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.id);

    // Broadcast status change
    if (status && status !== election.status) {
      const broadcast = req.app.get('broadcast');
      broadcast({ type: 'ELECTION_STATUS_CHANGE', payload: { election_id: req.params.id, status } });
    }

    res.json(updated);
  } catch (err) {
    console.error('Update election error:', err);
    res.status(500).json({ error: 'Failed to update election.' });
  }
});

// Delete election
router.delete('/:id', authenticateAdmin, (req, res) => {
  try {
    const election = db.prepare('SELECT * FROM elections WHERE id = ? AND created_by = ?').get(req.params.id, req.admin.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    if (election.status === 'active') {
      return res.status(400).json({ error: 'Cannot delete an active election. End it first.' });
    }

    db.prepare('DELETE FROM elections WHERE id = ?').run(req.params.id);
    res.json({ message: 'Election deleted successfully.' });
  } catch (err) {
    console.error('Delete election error:', err);
    res.status(500).json({ error: 'Failed to delete election.' });
  }
});

// Get election ballot (for voters)
router.get('/:id/ballot', (req, res) => {
  try {
    const election = db.prepare('SELECT * FROM elections WHERE id = ? AND status = ?').get(req.params.id, 'active');
    if (!election) {
      return res.status(404).json({ error: 'Election not found or not active.' });
    }

    const positions = db.prepare('SELECT * FROM positions WHERE election_id = ? ORDER BY display_order').all(election.id);

    const positionsWithCandidates = positions.map(pos => {
      const candidates = db.prepare('SELECT id, position_id, name, bio, photo_url, display_order FROM candidates WHERE position_id = ? ORDER BY display_order').all(pos.id);
      return { ...pos, candidates };
    });

    res.json({
      id: election.id,
      title: election.title,
      description: election.description,
      positions: positionsWithCandidates
    });
  } catch (err) {
    console.error('Get ballot error:', err);
    res.status(500).json({ error: 'Failed to fetch ballot.' });
  }
});

module.exports = router;
