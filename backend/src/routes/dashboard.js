const express = require('express');
const { pool } = require('../db/schema');
const router = express.Router();

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

module.exports = router;
