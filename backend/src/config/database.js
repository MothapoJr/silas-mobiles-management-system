// Sequelize instance, configured but not yet connected to any models —
// models and migrations are T10 (Database Schema Implementation) on the
// WBS, owned by Tayo. This file exists now so T10 has somewhere to plug
// into rather than starting from nothing.
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
  });
}

module.exports = { createSequelize };
