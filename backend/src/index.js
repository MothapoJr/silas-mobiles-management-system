const { createApp } = require('./app');
const env = require('./config/env');
const { loadSecrets } = require('./config/secrets');
const { initModels } = require('./models');
const { configureAuth } = require('./services/auth.service');
const { configureAuthMiddleware } = require('./middleware/auth.middleware');

async function start() {
  const secrets = await loadSecrets();

  // Configure JWT secrets before any request can hit auth routes
  configureAuth({
    jwtAccessSecret: secrets.jwtAccessSecret,
    jwtRefreshSecret: secrets.jwtRefreshSecret,
  });
  configureAuthMiddleware({
    jwtAccessSecret: secrets.jwtAccessSecret,
  });

  const { sequelize } = initModels({
    username: secrets.dbUsername,
    password: secrets.dbPassword,
  });

  try {
    await sequelize.authenticate();
    console.log('Database connection established.');
  } catch (err) {
    console.error('Database connection failed — continuing without it for now:', err.message);
  }

  const app = createApp();
  app.listen(env.port, () => {
    console.log(`Silas Mobiles backend listening on port ${env.port} (${env.nodeEnv})`);
  });
}

start();