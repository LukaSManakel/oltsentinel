const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { generateOSText } = require('../services/incidentService');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

router.get('/stats', async (req, res) => {
  try {
    const [off, crit, pow, on] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM onus WHERE status='offline'`),
      pool.query(`SELECT COUNT(*) FROM onus WHERE severity='critico'`),
      pool.query(`SELECT COUNT(*) FROM onus WHERE power_status IN ('critico_baixo','critico_alto')`),
      pool.query(`SELECT COUNT(*) FROM onus WHERE status='online'`),
    ]);
    res.json({ offline: parseInt(off.rows[0].count), criticos: parseInt(crit.rows[0].count), problemasPotencia: parseInt(pow.rows[0].count), online: parseInt(on.rows[0].count) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/offline', async (req, res) => {
  try {
    const { severity, limit = 100, offset = 0 } = req.query;
    let query = `SELECT id, name, olt_name, status, offline_since, offline_hours, power_dbm, power_status, severity, updated_at FROM onus WHERE status='offline' AND severity != 'none'`;
    const params = [];
    if (severity) { params.push(severity); query += ` AND severity=$${params.length}`; }
    query += ` ORDER BY offline_hours DESC LIMIT $${params.length+1} OFFSET $${params.length+2}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json(result.rows.map(onu => ({ ...onu, osText: generateOSText({ oltName: onu.olt_name, onuName: onu.name, offlineHours: parseFloat(onu.offline_hours), powerDbm: onu.power_dbm, severity: onu.severity }) })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/power-issues', async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, name, olt_name, power_dbm, power_status, status, updated_at FROM onus WHERE power_status IN ('critico_baixo','critico_alto') ORDER BY power_dbm ASC LIMIT 200`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/ranking-olts', async (req, res) => {
  try {
    const result = await pool.query(`SELECT olt_name, COUNT(*) FILTER (WHERE status='offline') as offline_count, COUNT(*) FILTER (WHERE severity='critico') as critico_count, COUNT(*) FILTER (WHERE power_status IN ('critico_baixo','critico_alto')) as power_issues FROM onus GROUP BY olt_name ORDER BY offline_count DESC LIMIT 20`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/trend', async (req, res) => {
  try {
    const result = await pool.query(`SELECT date_trunc('hour', created_at) as hour, COUNT(*) as total, COUNT(*) FILTER (WHERE severity='critico') as criticos FROM incidents WHERE created_at >= NOW() - INTERVAL '24 hours' GROUP BY hour ORDER BY hour ASC`);
    res.json(result.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/os-text/:id', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM onus WHERE id=$1`, [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'ONU não encontrada' });
    const onu = result.rows[0];
    res.json({ text: generateOSText({ oltName: onu.olt_name, onuName: onu.name, offlineHours: parseFloat(onu.offline_hours), powerDbm: onu.power_dbm, severity: onu.severity }) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
