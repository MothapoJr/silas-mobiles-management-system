'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Service extends Model {
    static associate(models) {
      Service.hasMany(models.QuoteItem, { foreignKey: 'serviceId' });
    }
  }

  Service.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      serviceName: { type: DataTypes.STRING, allowNull: false },
      description: { type: DataTypes.TEXT, allowNull: true },
      basePrice: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
    },
    { sequelize, modelName: 'Service', tableName: 'services' }
  );

  return Service;
};
