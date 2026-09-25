// Sequelize CLI needs its own plain, synchronous config (one object per
// environment) — it cannot await Secrets Manager the way src/config/secrets.js
// does for the running app. So migrations against staging/production are
// run as a deliberate one-off step with DB_PASSWORD exported into the shell
// first, not something the CLI reaches into AWS to fetch itself. See
// infrastructure/terraform/README.md and this repo's root README for the
// exact command.
require('dotenv').config();

const base = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'silas_mobiles',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  dialect: 'postgres',
};

module.exports = {
  development: base,
  // Deliberately NOT auto-suffixed with _test: config/database.js (what
  // the running app actually uses) has no equivalent logic, so a silent
  // suffix here would make the CLI and the app point at two different
  // databases without anything announcing it. Point DB_NAME at a
  // dedicated test database explicitly via the environment instead (CI
  // does this — see .github/workflows/ci.yml).
  test: { ...base, logging: false },
  production: {
    ...base,
    dialectOptions: { ssl: { require: true, rejectUnauthorized: true } },
  },
};
