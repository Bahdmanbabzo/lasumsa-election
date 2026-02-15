const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Add position to election
router.post('/positions', authenticateAdmin, (req, res) => {
  try {
    const { election_id, title, description, max_votes } = req.body;

    if (!election_id || !title) {
      return res.status(400).json({ error: 'Election ID and position title are required.' });
    }

    const election = db.prepare('SELECT * FROM elections WHERE id = ? AND created_by = ?').get(election_id, req.admin.id);
    if (!election) return res.status(404).json({ error: 'Election not found.' });

    const maxOrder = db.prepare('SELECT MAX(display_order) as max_order FROM positions WHERE election_id = ?').get(election_id);
    const displayOrder = (maxOrder?.max_order || 0) + 1;

    const id = uuidv4();
    db.prepare(`
      INSERT INTO positions (id, election_id, title, description, max_votes, display_order)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, election_id, title, description || '', max_votes || 1, displayOrder);

    const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(id);
    res.status(201).json(position);
  } catch (err) {
    console.error('Add position error:', err);
    res.status(500).json({ error: 'Failed to add position.' });
  }
});

// Update position
router.put('/positions/:id', authenticateAdmin, (req, res) => {
  try {
    const { title, description, max_votes } = req.body;
    db.prepare(`
      UPDATE positions SET title = COALESCE(?, title), description = COALESCE(?, description), max_votes = COALESCE(?, max_votes)
      WHERE id = ?
    `).run(title, description, max_votes, req.params.id);

    const position = db.prepare('SELECT * FROM positions WHERE id = ?').get(req.params.id);
    res.json(position);
  } catch (err) {
    console.error('Update position error:', err);
    res.status(500).json({ error: 'Failed to update position.' });
  }
});

// Delete position
router.delete('/positions/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM positions WHERE id = ?').run(req.params.id);
    res.json({ message: 'Position deleted.' });
  } catch (err) {
    console.error('Delete position error:', err);
    res.status(500).json({ error: 'Failed to delete position.' });
  }
});

// Add candidate
router.post('/', authenticateAdmin, (req, res) => {
  try {
    const { position_id, election_id, name, bio, photo_url } = req.body;

    if (!position_id || !election_id || !name) {
      return res.status(400).json({ error: 'Position ID, Election ID, and candidate name are required.' });
    }

    const maxOrder = db.prepare('SELECT MAX(display_order) as max_order FROM candidates WHERE position_id = ?').get(position_id);
    const displayOrder = (maxOrder?.max_order || 0) + 1;

    const id = uuidv4();
    db.prepare(`
      INSERT INTO candidates (id, position_id, election_id, name, bio, photo_url, display_order)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, position_id, election_id, name, bio || '', photo_url || '', displayOrder);

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(id);
    res.status(201).json(candidate);
  } catch (err) {
    console.error('Add candidate error:', err);
    res.status(500).json({ error: 'Failed to add candidate.' });
  }
});

// Update candidate
router.put('/:id', authenticateAdmin, (req, res) => {
  try {
    const { name, bio, photo_url } = req.body;
    db.prepare(`
      UPDATE candidates SET name = COALESCE(?, name), bio = COALESCE(?, bio), photo_url = COALESCE(?, photo_url)
      WHERE id = ?
    `).run(name, bio, photo_url, req.params.id);

    const candidate = db.prepare('SELECT * FROM candidates WHERE id = ?').get(req.params.id);
    res.json(candidate);
  } catch (err) {
    console.error('Update candidate error:', err);
    res.status(500).json({ error: 'Failed to update candidate.' });
  }
});

// Delete candidate
router.delete('/:id', authenticateAdmin, (req, res) => {
  try {
    db.prepare('DELETE FROM candidates WHERE id = ?').run(req.params.id);
    res.json({ message: 'Candidate deleted.' });
  } catch (err) {
    console.error('Delete candidate error:', err);
    res.status(500).json({ error: 'Failed to delete candidate.' });
  }
});

module.exports = router;
