'use strict';

const jwt = require('jsonwebtoken');

// Access token: short-lived, sent in Authorization header.
// Refresh token: longer-lived, sent as HttpOnly cookie.
// Secrets come from loadSecrets() at boot (env in local, Secrets Manager in staging/prod).

const ACCESS_TOKEN_EXPIRES = '15m';
const REFRESH_TOKEN_EXPIRES = '7d';

function signAccessToken(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRES });
}

function signRefreshToken(payload, secret) {
  return jwt.sign(payload, secret, { expiresIn: REFRESH_TOKEN_EXPIRES });
}

function verifyAccessToken(token, secret) {
  return jwt.verify(token, secret);
}

function verifyRefreshToken(token, secret) {
  return jwt.verify(token, secret);
}

module.exports = {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  ACCESS_TOKEN_EXPIRES,
  REFRESH_TOKEN_EXPIRES,
};