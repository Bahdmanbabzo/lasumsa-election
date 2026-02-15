const express = require('express');
const db = require('../models/database');
const { authenticateAdmin, authenticateAny } = require('../middleware/auth');

const router = express.Router();

// Get live election results (admin only)
router.get('/:electionId/results', authenticateAdmin, (req, res) => {
  try {
    const electionId = req.params.electionId;

    const election = db.prepare('SELECT * FROM elections WHERE id = ? AND created_by = ?').get(electionId, req.admin.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    const results = getFullResults(electionId);
    res.json(results);
  } catch (err) {
    console.error('Get results error:', err);
    res.status(500).json({ error: 'Failed to fetch results.' });
  }
});

// Get election overview stats (admin)
router.get('/:electionId/stats', authenticateAdmin, (req, res) => {
  try {
    const electionId = req.params.electionId;

    const election = db.prepare('SELECT * FROM elections WHERE id = ? AND created_by = ?').get(electionId, req.admin.id);
    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    const stats = db.prepare(`
      SELECT 
        (SELECT COUNT(*) FROM voters WHERE election_id = ?) as total_voters,
        (SELECT COUNT(*) FROM voters WHERE election_id = ? AND has_voted = 1) as votes_cast,
        (SELECT COUNT(*) FROM positions WHERE election_id = ?) as total_positions,
        (SELECT COUNT(*) FROM candidates WHERE election_id = ?) as total_candidates
    `).get(electionId, electionId, electionId, electionId);

    stats.turnout_percentage = stats.total_voters > 0
      ? Math.round((stats.votes_cast / stats.total_voters) * 100 * 10) / 10
      : 0;

    // Votes over time (last 24 hours, grouped by hour)
    const votesOverTime = db.prepare(`
      SELECT 
        strftime('%Y-%m-%d %H:00:00', v.cast_at) as hour,
        COUNT(*) as count
      FROM votes v
      WHERE v.election_id = ?
      GROUP BY hour
      ORDER BY hour
    `).all(electionId);

    // Department breakdown
    const departmentBreakdown = db.prepare(`
      SELECT 
        department,
        COUNT(*) as total,
        SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) as voted
      FROM voters
      WHERE election_id = ? AND department != ''
      GROUP BY department
      ORDER BY total DESC
    `).all(electionId);

    res.json({
      ...stats,
      election: {
        id: election.id,
        title: election.title,
        status: election.status,
        start_date: election.start_date,
        end_date: election.end_date
      },
      votes_over_time: votesOverTime,
      department_breakdown: departmentBreakdown
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// Get public results (if allowed)
router.get('/:electionId/public-results', (req, res) => {
  try {
    const election = db.prepare('SELECT * FROM elections WHERE id = ?').get(req.params.electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found.' });
    }

    if (!election.allow_results_view && election.status !== 'completed') {
      return res.status(403).json({ error: 'Results are not available for this election.' });
    }

    const results = getFullResults(req.params.electionId);
    res.json({
      election: { id: election.id, title: election.title, status: election.status },
      results
    });
  } catch (err) {
    console.error('Get public results error:', err);
    res.status(500).json({ error: 'Failed to fetch results.' });
  }
});

function getFullResults(electionId) {
  const positions = db.prepare('SELECT * FROM positions WHERE election_id = ? ORDER BY display_order').all(electionId);

  const voterStats = db.prepare(`
    SELECT 
      COUNT(*) as total_voters,
      SUM(CASE WHEN has_voted = 1 THEN 1 ELSE 0 END) as votes_cast
    FROM voters WHERE election_id = ?
  `).get(electionId);

  return {
    total_voters: voterStats.total_voters,
    votes_cast: voterStats.votes_cast,
    turnout: voterStats.total_voters > 0
      ? Math.round((voterStats.votes_cast / voterStats.total_voters) * 100 * 10) / 10
      : 0,
    positions: positions.map(pos => {
      const candidates = db.prepare(`
        SELECT c.id, c.name, c.bio, c.photo_url,
          (SELECT COUNT(*) FROM votes WHERE candidate_id = c.id) as vote_count
        FROM candidates c WHERE c.position_id = ?
        ORDER BY vote_count DESC
      `).all(pos.id);

      const totalVotes = candidates.reduce((sum, c) => sum + c.vote_count, 0);

      return {
        id: pos.id,
        title: pos.title,
        description: pos.description,
        max_votes: pos.max_votes,
        total_votes: totalVotes,
        candidates: candidates.map(c => ({
          ...c,
          percentage: totalVotes > 0 ? Math.round((c.vote_count / totalVotes) * 100 * 10) / 10 : 0
        }))
      };
    })
  };
}

module.exports = router;
