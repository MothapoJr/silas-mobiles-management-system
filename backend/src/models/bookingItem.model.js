'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class BookingItem extends Model {
    static associate(models) {
      BookingItem.belongsTo(models.Booking, { foreignKey: 'bookingId' });
      BookingItem.belongsTo(models.Equipment, { foreignKey: 'equipmentId' });
    }
  }

  BookingItem.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: { type: DataTypes.UUID, allowNull: false },
      equipmentId: { type: DataTypes.UUID, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
      rentalStartDate: { type: DataTypes.DATEONLY, allowNull: false },
      rentalEndDate: { type: DataTypes.DATEONLY, allowNull: false },
      // Snapshot of Equipment.dailyRate at the time this line was added —
      // see the migration's comment for why this exists beyond the
      // diagram's original spec.
      unitPriceAtBooking: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
      // quantity × unitPriceAtBooking × number of days — computed once
      // by the service layer that creates this row (T12), stored rather
      // than re-derived everywhere it's needed.
      lineTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    },
    { sequelize, modelName: 'BookingItem', tableName: 'booking_items' }
  );

  return BookingItem;
};
