'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Event extends Model {
    static associate(models) {
      Event.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  Event.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: { type: DataTypes.UUID, allowNull: false, unique: true },
      venue: { type: DataTypes.STRING, allowNull: false },
      guestCount: { type: DataTypes.INTEGER, allowNull: true, validate: { min: 0 } },
      setupTime: { type: DataTypes.DATE, allowNull: true },
      breakdownTime: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'Event', tableName: 'events' }
  );

  return Event;
};
