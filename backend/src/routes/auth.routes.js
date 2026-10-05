'use strict';

const express = require('express');
const { login, refresh } = require('../services/auth.service');
const { requireAuth } = require('../middleware/auth.middleware');

const router = express.Router();

// Cookie options for the refresh token (HttpOnly — JS cannot read it)
const REFRESH_COOKIE = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
  sameSite: 'lax',
  path: '/api/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * POST /api/auth/login
 * Body: { emailOrUsername, password }
 * Returns access token in JSON; sets refresh token as HttpOnly cookie.
 */
router.post('/login', async (req, res, next) => {
  try {
    const { emailOrUsername, password } = req.body || {};

    if (!emailOrUsername || !password) {
      return res.status(400).json({ error: 'emailOrUsername and password are required' });
    }

    const result = await login({ emailOrUsername, password });

    res.cookie('refreshToken', result.refreshToken, REFRESH_COOKIE);

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Reads refresh token from cookie; returns a new access token.
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;
    if (!token) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const result = await refresh(token);

    return res.json({
      accessToken: result.accessToken,
      user: result.user,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    return next(err);
  }
});

/**
 * POST /api/auth/logout
 * Clears the refresh cookie. Access token is discarded by the client.
 */
router.post('/logout', (_req, res) => {
  res.clearCookie('refreshToken', { path: '/api/auth' });
  return res.json({ message: 'Logged out' });
});

/**
 * GET /api/auth/me
 * Returns the current user from the access token (protected).
 */
router.get('/me', requireAuth, (req, res) => {
  return res.json({ user: req.user });
});

module.exports = router;