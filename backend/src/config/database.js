// Sequelize instance factory, used by src/models/index.js. Kept separate
// from the models themselves so nothing here needs to know what tables
// exist — it only knows how to connect.
const { Sequelize } = require('sequelize');
const env = require('./env');

function createSequelize({ username, password }) {
  return new Sequelize(env.db.name, username, password, {
    host: env.db.host,
    port: env.db.port,
    dialect: 'postgres',
    logging: env.nodeEnv === 'development' ? console.log : false,
    dialectOptions:
      env.nodeEnv === 'production' || env.nodeEnv === 'staging'
        ? { ssl: { require: true, rejectUnauthorized: true } }
        : {},
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    define: {
      // Models use camelCase attributes (roleType); the migrations created
      // snake_case columns (role_type), matching normal Postgres convention.
      // This is what maps one to the other everywhere, automatically.
      underscored: true,
    },
  });
}

module.exports = { createSequelize };
