const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateAdmin } = require('../middleware/auth');

const router = express.Router();

// Admin Registration
router.post('/register', (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const existing = db.prepare('SELECT id FROM admins WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const hashedPassword = bcrypt.hashSync(password, 12);
    const id = uuidv4();

    db.prepare('INSERT INTO admins (id, email, password, name) VALUES (?, ?, ?, ?)').run(id, email, hashedPassword, name);

    const token = jwt.sign(
      { id, email, name, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.status(201).json({ token, user: { id, email, name, role: 'admin' } });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// Admin Login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
    if (!admin) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const validPassword = bcrypt.compareSync(password, admin.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: admin.id, email: admin.email, name: admin.name, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({ token, user: { id: admin.id, email: admin.email, name: admin.name, role: 'admin' } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// Voter Login (matric number + voting code)
router.post('/voter-login', (req, res) => {
  try {
    const { matric_number, voting_code } = req.body;

    if (!matric_number || !voting_code) {
      return res.status(400).json({ error: 'Matric number and voting code are required.' });
    }

    const voter = db.prepare(`
      SELECT v.*, e.title as election_title, e.status as election_status, 
             e.start_date, e.end_date, e.id as election_id
      FROM voters v 
      JOIN elections e ON v.election_id = e.id 
      WHERE v.matric_number = ? AND v.voting_code = ?
    `).get(matric_number.toUpperCase().trim(), voting_code.trim());

    if (!voter) {
      return res.status(401).json({ error: 'Invalid matric number or voting code.' });
    }

    if (voter.election_status !== 'active') {
      return res.status(403).json({ error: 'This election is not currently active.' });
    }

    if (voter.has_voted) {
      return res.status(403).json({ error: 'You have already cast your vote in this election.' });
    }

    const token = jwt.sign(
      {
        id: voter.id,
        matric_number: voter.matric_number,
        name: voter.name,
        election_id: voter.election_id,
        role: 'voter'
      },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    res.json({
      token,
      voter: {
        id: voter.id,
        name: voter.name,
        matric_number: voter.matric_number,
        department: voter.department,
        election_id: voter.election_id,
        election_title: voter.election_title,
        has_voted: voter.has_voted,
        role: 'voter'
      }
    });
  } catch (err) {
    console.error('Voter login error:', err);
    res.status(500).json({ error: 'Server error during voter login.' });
  }
});

// Get current user
router.get('/me', authenticateAdmin, (req, res) => {
  res.json({ user: req.admin });
});

module.exports = router;
