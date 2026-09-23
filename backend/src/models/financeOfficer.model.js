'use strict';
const { Model, DataTypes } = require('sequelize');

// Never modelled in the Design Class Diagram code at all — added here to
// close that gap (see the migration's comment for the full context).
module.exports = (sequelize) => {
  class FinanceOfficer extends Model {
    static associate(models) {
      FinanceOfficer.belongsTo(models.User, { foreignKey: 'id' });
    }
  }

  FinanceOfficer.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      department: { type: DataTypes.STRING, allowNull: true },
    },
    { sequelize, modelName: 'FinanceOfficer', tableName: 'finance_officers' }
  );

  return FinanceOfficer;
};
