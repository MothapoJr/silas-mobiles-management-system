'use strict';
const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Staff extends Model {
    static associate(models) {
      Staff.belongsTo(models.User, { foreignKey: 'id' });
      Staff.hasMany(models.StaffAssignment, { foreignKey: 'staffId' });
      Staff.belongsToMany(models.Booking, {
        through: models.StaffAssignment,
        foreignKey: 'staffId',
        otherKey: 'bookingId',
        as: 'assignedBookings',
      });
    }
  }

  Staff.init(
    {
      id: { type: DataTypes.UUID, primaryKey: true },
      // Diagram calls this "role" — renamed to avoid reading as
      // users.roleType (a different concept) one join away. See the
      // migration's comment for the full reasoning.
      jobRole: { type: DataTypes.STRING, allowNull: true },
      vehicleLicense: { type: DataTypes.STRING, allowNull: true },
      availability: {
        type: DataTypes.ENUM('available', 'unavailable', 'on_leave'),
        allowNull: false,
        defaultValue: 'available',
      },
    },
    { sequelize, modelName: 'Staff', tableName: 'staff' }
  );

  return Staff;
};
