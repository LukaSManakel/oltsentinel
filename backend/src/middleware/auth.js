const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config');

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header) {
    console.warn('[Auth] Requisição sem header Authorization');
    return res.status(401).json({ error: 'Token não fornecido' });
  }

  const token = header.replace('Bearer ', '');
  
  if (!token || token === 'null' || token === 'undefined') {
    console.warn('[Auth] Token inválido no header:', token);
    return res.status(401).json({ error: 'Token malformado' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error(`[Auth Error] ${err.message} | Token start: ${token.substring(0, 10)}... | Secret Mask: ${JWT_SECRET.substring(0, 4)}***`);
    res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

function adminOnly(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso restrito a administradores' });
  }
  next();
}

module.exports = { authMiddleware, adminOnly };
