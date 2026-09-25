'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Administrator extends Model {
    static associate(models) {
      Administrator.belongsTo(models.User, { foreignKey: 'id' });
      Administrator.hasMany(models.Booking, { foreignKey: 'approvedByAdminId', as: 'approvedBookings' });
    }
  }

  Administrator.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      department: { type: DataTypes.STRING, allowNull: true },
      accessLevel: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, modelName: 'Administrator', tableName: 'administrators' }
  );

  return Administrator;
};
