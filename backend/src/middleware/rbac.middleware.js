'use strict';

/**
 * Role-based access control.
 * Usage: requireRole('administrator')
 *        requireRole('administrator', 'finance_officer')
 *
 * Must be used AFTER requireAuth so req.user exists.
 */
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden — insufficient role' });
    }

    return next();
  };
}

module.exports = { requireRole };