const express = require('express');
const { pool } = require('../db/schema');
const { authMiddleware } = require('../middleware/auth');
const router = express.Router();

router.use(authMiddleware);

// Stats gerais
router.get('/stats', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE status='offline') as offline,
        COUNT(*) FILTER (WHERE severity='critico') as criticos,
        COUNT(*) FILTER (WHERE power_status='critico') as "problemasPotencia",
        COUNT(*) FILTER (WHERE status='online') as online
      FROM onus
    `);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista ONUs offline
router.get('/offline', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM onus WHERE status='offline'
      ORDER BY offline_hours DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista ONUs com problema de potência
router.get('/power-issues', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM onus WHERE power_status != 'normal' AND power_dbm IS NOT NULL
      ORDER BY power_dbm ASC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Lista OLTs
router.get('/olts', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM olts ORDER BY name`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Incidentes
router.get('/incidents', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM incidents ORDER BY created_at DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
