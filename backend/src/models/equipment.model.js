'use strict';
const { Model, DataTypes } = require('sequelize');

// status consolidates the Design Class Diagram's separate status +
// availability String fields into the one ENUM the Equipment Status
// Lifecycle state diagram actually describes — see the migration's
// comment for why.
module.exports = (sequelize) => {
  class Equipment extends Model {
    static associate(models) {
      Equipment.belongsTo(models.EquipmentCategory, { foreignKey: 'categoryId' });
      Equipment.hasMany(models.BookingItem, { foreignKey: 'equipmentId' });
    }
  }

  Equipment.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      categoryId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING, allowNull: false },
      status: {
        type: DataTypes.ENUM('available', 'reserved', 'active_deployment', 'maintenance', 'retired'),
        allowNull: false,
        defaultValue: 'available',
      },
      dailyRate: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: { min: 0 },
      },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, modelName: 'Equipment', tableName: 'equipment' }
  );

  return Equipment;
};
