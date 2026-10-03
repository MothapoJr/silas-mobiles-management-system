'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Notification extends Model {
    static associate(models) {
      Notification.belongsTo(models.User, { foreignKey: 'userId' });
      Notification.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  Notification.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      bookingId: { type: DataTypes.UUID, allowNull: true },
      message: { type: DataTypes.TEXT, allowNull: false },
      // See the migration's comment — left as a plain string deliberately.
      type: { type: DataTypes.STRING, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'sent', 'failed', 'read'),
        allowNull: false,
        defaultValue: 'pending',
      },
    },
    { sequelize, modelName: 'Notification', tableName: 'notifications' }
  );

  return Notification;
};
