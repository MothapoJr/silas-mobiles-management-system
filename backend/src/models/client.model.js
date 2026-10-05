'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Client extends Model {
    static associate(models) {
      Client.belongsTo(models.User, { foreignKey: 'id' });
      Client.hasMany(models.Booking, { foreignKey: 'clientId' });
      Client.hasMany(models.Quote, { foreignKey: 'clientId' });
    }
  }

  Client.init(
    {
      // Deliberately no defaultValue here — a Client always takes the id
      // of the User row it extends, assigned explicitly wherever a Client
      // is created (T11's registration flow), never generated fresh.
      id: { type: DataTypes.UUID, primaryKey: true },
      name: { type: DataTypes.STRING, allowNull: false },
      contactDetails: { type: DataTypes.STRING, allowNull: true },
      address: { type: DataTypes.TEXT, allowNull: true },
      companyName: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, modelName: 'Client', tableName: 'clients' }
  );

  return Client;
};
