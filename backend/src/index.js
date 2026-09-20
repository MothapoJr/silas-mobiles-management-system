const { createApp } = require('./app');
const env = require('./config/env');
const { loadSecrets } = require('./config/secrets');
const { createSequelize } = require('./config/database');

async function start() {
  const secrets = await loadSecrets();
  const sequelize = createSequelize({
    username: secrets.dbUsername,
    password: secrets.dbPassword,
  });

  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
  } catch (err) {
    // Deliberately non-fatal at this stage of the build: no models exist
    // yet (T10), so a fresh environment with a not-yet-reachable database
    // shouldn't stop the health endpoint from coming up. Revisit once T10
    // lands and real routes actually depend on the database being present.
    console.error('Database connection failed — continuing without it for now:', err.message);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Silas Mobiles backend listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
