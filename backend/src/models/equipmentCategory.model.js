'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class EquipmentCategory extends Model {
    static associate(models) {
      EquipmentCategory.hasMany(models.Equipment, { foreignKey: 'categoryId' });
    }
  }

  EquipmentCategory.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      categoryName: { type: DataTypes.STRING, allowNull: false, unique: true },
      description: { type: DataTypes.TEXT, allowNull: true },
    },
    { sequelize, modelName: 'EquipmentCategory', tableName: 'equipment_categories' }
  );

  return EquipmentCategory;
};
