'use strict';

const { verifyAccessToken } = require('../utils/tokens');

// Secrets injected at boot (same pattern as auth.service).
let jwtAccessSecret = null;

function configureAuthMiddleware({ jwtAccessSecret: access }) {
  jwtAccessSecret = access;
}

/**
 * Requires a valid Bearer access token.
 * On success: attaches req.user = { id, role, email }
 */
function requireAuth(req, res, next) {
  if (!jwtAccessSecret) {
    return res.status(500).json({ error: 'Auth middleware not configured' });
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = header.slice(7);

  try {
    const decoded = verifyAccessToken(token, jwtAccessSecret);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
    };
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired access token' });
  }
}

module.exports = {
  configureAuthMiddleware,
  requireAuth,
};