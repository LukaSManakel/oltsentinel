const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'olt-sentinel-secret-2026';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ error: 'Token não fornecido' });

  const token = header.replace('Bearer ', '');
  
  if (!token || token === 'null' || token === 'undefined') {
    return res.status(401).json({ error: 'Token inválido no frontend' });
  }

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.error('[Auth] Erro ao verificar token:', err.message);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function adminOnly(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
