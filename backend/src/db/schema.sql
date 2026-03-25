CREATE TABLE IF NOT EXISTS olts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  host_id VARCHAR(100),
  ip VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS onus (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  olt_id INTEGER REFERENCES olts(id),
  olt_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'unknown',
  offline_since TIMESTAMPTZ,
  offline_hours DECIMAL(10,2) DEFAULT 0,
  power_dbm DECIMAL(6,2),
  power_status VARCHAR(20) DEFAULT 'normal',
  severity VARCHAR(20) DEFAULT 'none',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incidents (
  id SERIAL PRIMARY KEY,
  onu_id INTEGER REFERENCES onus(id),
  onu_name VARCHAR(255),
  olt_name VARCHAR(255),
  type VARCHAR(50),
  severity VARCHAR(20),
  offline_hours DECIMAL(10,2),
  power_dbm DECIMAL(6,2),
  description TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_onus_status ON onus(status);
CREATE INDEX IF NOT EXISTS idx_onus_severity ON onus(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_created ON incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_incidents_resolved ON incidents(resolved);
