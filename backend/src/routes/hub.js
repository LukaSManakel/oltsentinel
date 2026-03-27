const express = require('express');
const { pool } = require('../db/schema');
const { authMiddleware, adminOnly } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const router = express.Router();

router.use(authMiddleware);

const RESPONSAVEIS = {
  1: 'Daniel',
  2: 'Lucas Valle',
  3: 'Rafael',
  4: 'Victor',
  5: 'Hugo',
};

const TAREFAS_DIARIAS = [
  'Abertura de chamados fibra offline',
  'Verificação de clientes com potência anormal',
];

// Dashboard do dia
router.get('/dashboard', async (req, res) => {
  try {
    const hoje = new Date();
    const diaSemana = hoje.getDay() === 0 ? 7 : hoje.getDay();
    const responsavel = RESPONSAVEIS[diaSemana] || 'Não definido';
    const dataHoje = hoje.toISOString().split('T')[0];

    for (const titulo of TAREFAS_DIARIAS) {
      await pool.query(
        `INSERT INTO tasks (titulo, tipo, data) VALUES ($1,'diaria',$2) ON CONFLICT DO NOTHING`,
        [titulo, dataHoje]
      );
    }

    const tasks = await pool.query(
      `SELECT t.*, u.nome as concluido_por_nome FROM tasks t
       LEFT JOIN users u ON t.concluido_por = u.id
       WHERE t.data = $1 ORDER BY t.id`,
      [dataHoje]
    );

    const stats = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE status='pendente') as pendentes,
        COUNT(*) FILTER (WHERE status='concluido') as concluidos
      FROM tasks WHERE data=$1
    `, [dataHoje]);

    res.json({ responsavel, data: dataHoje, tasks: tasks.rows, stats: stats.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Concluir tarefa
router.post('/tasks/:id/concluir', async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE tasks SET status='concluido', concluido_por=$1, concluido_em=NOW() WHERE id=$2 RETURNING *`,
      [req.user.id, req.params.id]
    );

    await pool.query(
      `INSERT INTO activity_log (user_id, acao, detalhes) VALUES ($1,'concluiu_tarefa',$2)`,
      [req.user.id, result.rows[0]?.titulo]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar tarefa manual (admin)
router.post('/tasks', adminOnly, async (req, res) => {
  const { titulo, tipo, data, responsavel_id } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO tasks (titulo, tipo, data, responsavel_id) VALUES ($1,$2,$3,$4) RETURNING *`,
      [titulo, tipo || 'manual', data, responsavel_id || null]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar eventos
router.get('/events', async (req, res) => {
  try {
    const result = await pool.query(`SELECT * FROM events ORDER BY data_inicio ASC`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar evento (admin)
router.post('/events', adminOnly, async (req, res) => {
  const { titulo, descricao, tipo, data_inicio, data_fim, participantes } = req.body;
  try {
    // Stringify array of participants for JSONB column
    const result = await pool.query(
      `INSERT INTO events (titulo, descricao, tipo, data_inicio, data_fim, participantes, criado_por)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [titulo, descricao, tipo, data_inicio, data_fim, JSON.stringify(participantes || []), req.user.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Deletar evento (admin)
router.delete('/events/:id', adminOnly, async (req, res) => {
  try {
    await pool.query(`DELETE FROM events WHERE id=$1`, [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ranking de produtividade
router.get('/ranking', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.nome, COUNT(t.id) as concluidas
      FROM users u
      LEFT JOIN tasks t ON t.concluido_por = u.id AND t.status='concluido'
      GROUP BY u.nome ORDER BY concluidas DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Histórico de tarefas
router.get('/historico', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.*, u.nome as concluido_por_nome FROM tasks t
      LEFT JOIN users u ON t.concluido_por = u.id
      WHERE t.status='concluido' ORDER BY t.concluido_em DESC LIMIT 100
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listar usuários (admin)
router.get('/users', adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`SELECT id, nome, email, role, ativo, created_at FROM users ORDER BY id`);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Criar usuário (admin)
router.post('/users', adminOnly, async (req, res) => {
  const { nome, email, senha, role } = req.body;
  try {
    const hash = await bcrypt.hash(senha, 10);
    const result = await pool.query(
      `INSERT INTO users (nome, email, senha_hash, role) VALUES ($1,$2,$3,$4) RETURNING id, nome, email, role`,
      [nome, email.toLowerCase(), hash, role || 'suporte']
    );
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Email já cadastrado' });
    res.status(500).json({ error: err.message });
  }
});

// Desativar/ativar usuário (admin)
router.patch('/users/:id/toggle', adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET ativo = NOT ativo WHERE id=$1 RETURNING id, nome, ativo`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Log de atividades
router.get('/logs', adminOnly, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, u.nome FROM activity_log l
      LEFT JOIN users u ON l.user_id = u.id
      ORDER BY l.created_at DESC LIMIT 200
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
