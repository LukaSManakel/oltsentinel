const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/schema');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'olt-sentinel-secret-2026';

router.post('/login', async (req, res) => {
  const { email, senha } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE email=$1 AND ativo=TRUE', [email.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Credenciais inválidas' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(senha, user.senha);
    if (!valid) return res.status(401).json({ error: 'Credenciais inválidas' });
    const token = jwt.sign({ id: user.id, role: user.role, nome: user.nome }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, nome: user.nome, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/register', async (req, res) => {
  const { nome, email, senha, role } = req.body;
  try {
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO users (nome, email, senha, role) VALUES ($1,$2,$3,$4) RETURNING id, nome, email, role`,
      [nome, email.toLowerCase(), hash, role || 'suporte']
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email já cadastrado' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
