const { createApp } = require('./app');
const env = require('./config/env');
const { loadSecrets } = require('./config/secrets');
const { initModels } = require('./models');

async function start() {
  const secrets = await loadSecrets();
  const { sequelize } = initModels({
    username: secrets.dbUsername,
    password: secrets.dbPassword,
  });

  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
  } catch (err) {
    // Still non-fatal: the schema exists now (T10's migrations), but no
    // route yet queries it — Auth/Client/Admin/Staff modules are T11–T15.
    // Revisit once any of those land and genuinely need the database up
    // to serve a request.
    console.error('Database connection failed — continuing without it for now:', err.message);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Silas Mobiles backend listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();
