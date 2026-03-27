require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const { initDB } = require('./db/schema');
const { collectData } = require('./jobs/collector');
const dashboardRoutes = require('./routes/dashboard');
const authRoutes = require('./routes/auth');
const hubRoutes = require('./routes/hub');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Rotas públicas
app.use('/api/auth', authRoutes);

// Rotas protegidas (o dashboard está livre agora para visualização rápida)
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/hub', hubRoutes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', uptime: process.uptime() }));

app.listen(PORT, async () => {
  console.log(`[OLT Sentinel] Rodando na porta ${PORT}`);
  await initDB();
  
  // Primeira coleta após 3s
  setTimeout(collectData, 3000);
  
  // Cron a cada 5 min
  cron.schedule('*/5 * * * *', collectData);
});
