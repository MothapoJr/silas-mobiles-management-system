'use strict';
const { Model, DataTypes } = require('sequelize');

// Base authentication table shared by every role. Password hashing
// (bcrypt) and the login/logout/changePassword behaviours from the Design
// Class Diagram belong to the Auth module (T11) as service-layer logic,
// not here — this model owns structure and constraints, not business
// rules, so it stays usable regardless of how auth ends up implemented.
module.exports = (sequelize) => {
  class User extends Model {
    static associate(models) {
      User.hasOne(models.Client, { foreignKey: 'id', onDelete: 'CASCADE' });
      User.hasOne(models.Administrator, { foreignKey: 'id', onDelete: 'CASCADE' });
      User.hasOne(models.Staff, { foreignKey: 'id', onDelete: 'CASCADE' });
      User.hasOne(models.FinanceOfficer, { foreignKey: 'id', onDelete: 'CASCADE' });
      User.hasMany(models.Notification, { foreignKey: 'userId' });
    }
  }

  User.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      username: { type: DataTypes.STRING, allowNull: false, unique: true },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      passwordHash: { type: DataTypes.STRING, allowNull: false },
      roleType: {
        type: DataTypes.ENUM('client', 'administrator', 'staff', 'finance_officer'),
        allowNull: false,
      },
      isActive: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      lastLoginAt: { type: DataTypes.DATE, allowNull: true },
    },
    { sequelize, modelName: 'User', tableName: 'users' }
  );

  return User;
};
