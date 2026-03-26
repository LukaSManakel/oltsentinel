const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS olts (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, host_id TEXT, ip TEXT, updated_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS onus (id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL, olt_name TEXT, status TEXT DEFAULT 'online', offline_since TIMESTAMP, offline_hours FLOAT DEFAULT 0, power_dbm FLOAT, power_status TEXT DEFAULT 'normal', severity TEXT DEFAULT 'none', last_seen TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS incidents (id SERIAL PRIMARY KEY, onu_name TEXT, olt_name TEXT, type TEXT, severity TEXT, offline_hours FLOAT, power_dbm FLOAT, description TEXT, resolved BOOLEAN DEFAULT FALSE, resolved_at TIMESTAMP, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS users (id SERIAL PRIMARY KEY, nome TEXT NOT NULL, email TEXT UNIQUE NOT NULL, senha TEXT NOT NULL, role TEXT DEFAULT 'suporte', ativo BOOLEAN DEFAULT TRUE, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS tasks (id SERIAL PRIMARY KEY, titulo TEXT NOT NULL, tipo TEXT DEFAULT 'diaria', status TEXT DEFAULT 'pendente', responsavel_id INTEGER REFERENCES users(id), concluido_por INTEGER REFERENCES users(id), concluido_em TIMESTAMP, data DATE DEFAULT CURRENT_DATE, created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS events (id SERIAL PRIMARY KEY, titulo TEXT NOT NULL, descricao TEXT, tipo TEXT DEFAULT 'reuniao', data_inicio TIMESTAMP NOT NULL, data_fim TIMESTAMP, participantes TEXT[], criado_por INTEGER REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS pops_visits (id SERIAL PRIMARY KEY, pop_nome TEXT NOT NULL, data DATE NOT NULL, equipe TEXT, status TEXT DEFAULT 'pendente', observacao TEXT, criado_por INTEGER REFERENCES users(id), created_at TIMESTAMP DEFAULT NOW());
      CREATE TABLE IF NOT EXISTS activity_log (id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), acao TEXT NOT NULL, detalhes TEXT, created_at TIMESTAMP DEFAULT NOW());
    `);
    const adminEmail = 'vallelukas@outlook.com.br';
    const exists = await client.query('SELECT id FROM users WHERE email=$1', [adminEmail]);
    if (exists.rows.length === 0) {
      const hash = await bcrypt.hash('Samuraipro1@', 10);
      await client.query(`INSERT INTO users (nome, email, senha, role) VALUES ($1,$2,$3,'admin')`, ['Lucas Valle Carvalho', adminEmail, hash]);
      console.log('[DB] Admin criado:', adminEmail);
    }
    console.log('[DB] Schema OK');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };

