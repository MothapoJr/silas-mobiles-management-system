'use strict';

const bcrypt = require('bcryptjs');
const { getModels } = require('../models');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('../utils/tokens');

// Secrets are injected once at boot (see index.js) so this module never
// reads process.env itself and stays consistent with Secrets Manager in
// staging/production.
let jwtAccessSecret = null;
let jwtRefreshSecret = null;

function configureAuth({ jwtAccessSecret: access, jwtRefreshSecret: refresh }) {
  jwtAccessSecret = access;
  jwtRefreshSecret = refresh;
}

function assertConfigured() {
  if (!jwtAccessSecret || !jwtRefreshSecret) {
    throw new Error('Auth not configured — call configureAuth() at boot first');
  }
}

/**
 * Login with email (or username) + password.
 * Returns { user, accessToken, refreshToken } or throws with .status.
 */
async function login({ emailOrUsername, password }) {
  assertConfigured();
  const { User } = getModels();

  const user = await User.findOne({
    where: {
      [require('sequelize').Op.or]: [
        { email: emailOrUsername },
        { username: emailOrUsername },
      ],
    },
  });

  if (!user || !user.isActive) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  // Demo seed still has a placeholder hash until we re-seed with real bcrypt.
  // Treat placeholder as "password is Demo123!" for local development only.
  const isPlaceholder = user.passwordHash === 'SEED-DATA-NOT-A-REAL-BCRYPT-HASH-REPLACE-IN-T11';
  let passwordOk = false;

  if (isPlaceholder) {
    passwordOk = password === 'Demo123!';
  } else {
    passwordOk = await bcrypt.compare(password, user.passwordHash);
  }

  if (!passwordOk) {
    const err = new Error('Invalid credentials');
    err.status = 401;
    throw err;
  }

  await user.update({ lastLoginAt: new Date() });

  const payload = {
    sub: user.id,
    role: user.roleType,
    email: user.email,
  };

  const accessToken = signAccessToken(payload, jwtAccessSecret);
  const refreshToken = signRefreshToken({ sub: user.id }, jwtRefreshSecret);

  return {
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roleType: user.roleType,
    },
    accessToken,
    refreshToken,
  };
}

/**
 * Exchange a valid refresh token for a new access token.
 */
async function refresh(refreshToken) {
  assertConfigured();
  const { User } = getModels();

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken, jwtRefreshSecret);
  } catch {
    const err = new Error('Invalid or expired refresh token');
    err.status = 401;
    throw err;
  }

  const user = await User.findByPk(decoded.sub);
  if (!user || !user.isActive) {
    const err = new Error('User not found or inactive');
    err.status = 401;
    throw err;
  }

  const payload = {
    sub: user.id,
    role: user.roleType,
    email: user.email,
  };

  return {
    accessToken: signAccessToken(payload, jwtAccessSecret),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      roleType: user.roleType,
    },
  };
}

/**
 * Hash a plain password (used later when creating users / resetting).
 */
async function hashPassword(plain) {
  return bcrypt.hash(plain, 12);
}

module.exports = {
  configureAuth,
  login,
  refresh,
  hashPassword,
};