'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Quote extends Model {
    static associate(models) {
      Quote.belongsTo(models.Client, { foreignKey: 'clientId' });
      Quote.belongsTo(models.Booking, { foreignKey: 'convertedBookingId', as: 'convertedBooking' });
      Quote.hasMany(models.QuoteItem, { foreignKey: 'quoteId' });
    }
  }

  Quote.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      clientId: { type: DataTypes.UUID, allowNull: false },
      convertedBookingId: { type: DataTypes.UUID, allowNull: true },
      quoteDate: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('draft', 'sent', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      totalEstimate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
    },
    { sequelize, modelName: 'Quote', tableName: 'quotes' }
  );

  return Quote;
};
