require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const { Pool } = require('pg');
const { collectData } = require('./jobs/collector');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/dashboard', require('./routes/dashboard'));
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

async function initDB() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const schema = fs.readFileSync(path.join(__dirname, 'db/schema.sql'), 'utf8');
  try { await pool.query(schema); console.log('[DB] Schema OK'); }
  catch (err) { console.error('[DB] Erro:', err.message); }
  await pool.end();
}

cron.schedule('*/5 * * * *', () => { console.log('[Cron] Coletando...'); collectData().catch(console.error); });

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[OLT Sentinel] Rodando na porta ${PORT}`);
    setTimeout(() => collectData().catch(console.error), 3000);
  });
});
