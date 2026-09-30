// Builds the Express app without starting it — kept separate from index.js
// so tests can import the app and drive it with supertest in-memory,
// without opening a real port or needing a database connection.
//
// The three security middlewares here are the day-one implementation of
// promises made in Section 9.1.13 (Security) of the Task 1 documentation:
// helmet sets the CSP and related headers, cors restricts which origins
// can call the API at all, and express-rate-limit is the concrete form of
// the "rate limiting" mitigation listed against brute-force and DDoS risk.
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const env = require('./config/env');
const healthRoutes = require('./routes/health.routes');
const authRoutes = require('./routes/auth.routes');
const clientRoutes = require('./routes/client.routes');
const adminRoutes = require('./routes/admin.routes');
const staffRoutes = require('./routes/staff.routes');

function createApp() {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true, // refresh token travels as an HttpOnly cookie — see Section 9.1.13
    })
  );
  app.use(express.json());
  app.use(cookieParser());

  const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api', apiLimiter);

  // Stricter limiter on auth endpoints (brute-force protection)
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 30,
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/auth', authLimiter);

  app.use(healthRoutes);
  app.use('/api/auth', authRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/staff', staffRoutes);
  // Client, Admin, Staff and Notification routers mount here from T12–T15

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(err.status || 500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = { createApp };