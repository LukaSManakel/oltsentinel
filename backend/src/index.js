const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initDB } = require('./db/schema');
const { collectData } = require('./jobs/collector');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const hubRoutes = require('./routes/hub');

require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hub', hubRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Inicia servidor
initDB().then(async () => {
  app.listen(PORT, () => console.log(`[OLT Sentinel] Rodando na porta ${PORT}`));

  // Coleta inicial
  setTimeout(() => collectData(), 3000);

  // Cron a cada 5 minutos
  cron.schedule('*/5 * * * *', () => {
    console.log('[Cron] Coletando...');
    collectData();
  });
});
