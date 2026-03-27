const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  host: process.env.DB_HOST || 'postgres',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'oltsentinel',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS olts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        host_id VARCHAR(255),
        ip VARCHAR(100),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT olts_name_unique UNIQUE (name)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS onus (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        olt_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'unknown',
        offline_since TIMESTAMPTZ,
        offline_hours FLOAT DEFAULT 0,
        power_dbm FLOAT,
        power_status VARCHAR(50),
        severity VARCHAR(50) DEFAULT 'info',
        last_seen TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'onus_name_unique'
        ) THEN
          ALTER TABLE onus ADD CONSTRAINT onus_name_unique UNIQUE (name);
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        id SERIAL PRIMARY KEY,
        onu_name VARCHAR(255),
        olt_name VARCHAR(255),
        type VARCHAR(100),
        severity VARCHAR(50),
        offline_hours FLOAT,
        power_dbm FLOAT,
        description TEXT,
        resolved BOOLEAN DEFAULT FALSE,
        resolved_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        senha_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'suporte',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        tipo VARCHAR(50) DEFAULT 'diaria',
        status VARCHAR(50) DEFAULT 'pendente',
        responsavel_id INTEGER REFERENCES users(id),
        data DATE DEFAULT CURRENT_DATE,
        concluido_por INTEGER REFERENCES users(id),
        concluido_em TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        data TIMESTAMPTZ,
        participantes TEXT,
        criado_por INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        acao TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const adminCheck = await client.query(
      "SELECT id FROM users WHERE email = 'vallelukas@outlook.com.br'"
    );
    if (adminCheck.rows.length === 0) {
      const hash = await bcrypt.hash('Samuraipro1@', 10);
      await client.query(
        "INSERT INTO users (nome, email, senha_hash, role) VALUES ($1, $2, $3, $4)",
        ['Lucas Valle Carvalho', 'vallelukas@outlook.com.br', hash, 'admin']
      );
      console.log('[DB] Admin user criado.');
    }

    console.log('[DB] Schema OK');
  } finally {
    client.release();
  }
}

module.exports = { pool, initDB };
