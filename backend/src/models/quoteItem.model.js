'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class QuoteItem extends Model {
    static associate(models) {
      QuoteItem.belongsTo(models.Quote, { foreignKey: 'quoteId' });
      QuoteItem.belongsTo(models.Service, { foreignKey: 'serviceId' });
    }
  }

  QuoteItem.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      quoteId: { type: DataTypes.UUID, allowNull: false },
      serviceId: { type: DataTypes.UUID, allowNull: false },
      quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1, validate: { min: 1 } },
      unitPrice: { type: DataTypes.DECIMAL(10, 2), allowNull: false, validate: { min: 0 } },
    },
    { sequelize, modelName: 'QuoteItem', tableName: 'quote_items' }
  );

  return QuoteItem;
};
