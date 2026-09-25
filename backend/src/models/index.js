'use strict';

// Initializes every model against one Sequelize instance and wires their
// associations, then caches the result — called once at boot (src/index.js)
// with the credentials resolved from Secrets Manager/env, and read
// thereafter via getModels() by anything that needs it (T11+'s route
// handlers), without needing to pass credentials around a second time.
const { createSequelize } = require('../config/database');

const modelDefiners = {
  User: require('./user.model'),
  Client: require('./client.model'),
  Administrator: require('./administrator.model'),
  Staff: require('./staff.model'),
  FinanceOfficer: require('./financeOfficer.model'),
  EquipmentCategory: require('./equipmentCategory.model'),
  Equipment: require('./equipment.model'),
  Service: require('./service.model'),
  Booking: require('./booking.model'),
  Event: require('./event.model'),
  BookingItem: require('./bookingItem.model'),
  StaffAssignment: require('./staffAssignment.model'),
  Quote: require('./quote.model'),
  QuoteItem: require('./quoteItem.model'),
  Invoice: require('./invoice.model'),
  Notification: require('./notification.model'),
};

let cached = null;

function initModels({ username, password }) {
  if (cached) return cached;

  const sequelize = createSequelize({ username, password });

  const models = {};
  for (const [name, define] of Object.entries(modelDefiners)) {
    models[name] = define(sequelize);
  }

  for (const model of Object.values(models)) {
    if (typeof model.associate === 'function') {
      model.associate(models);
    }
  }

  cached = { sequelize, ...models };
  return cached;
}

function getModels() {
  if (!cached) {
    throw new Error('Models not initialized — call initModels() once at boot (src/index.js) first.');
  }
  return cached;
}

// Test-only: lets each test file start from a clean slate instead of
// reusing whatever a previous test file's initModels() call cached.
function _resetForTests() {
  cached = null;
}

module.exports = { initModels, getModels, _resetForTests };
