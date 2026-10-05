'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Invoice extends Model {
    static associate(models) {
      Invoice.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  Invoice.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      bookingId: { type: DataTypes.UUID, allowNull: false },
      amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
      paymentMethod: { type: DataTypes.STRING, allowNull: true },
      paymentStatus: {
        type: DataTypes.ENUM('unpaid', 'partial', 'paid'),
        allowNull: false,
        defaultValue: 'unpaid',
      },
      issueDate: { type: DataTypes.DATEONLY, allowNull: false },
      dueDate: { type: DataTypes.DATEONLY, allowNull: true },
    },
    { sequelize, modelName: 'Invoice', tableName: 'invoices' }
  );

  return Invoice;
};
