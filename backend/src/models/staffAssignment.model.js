'use strict';
const { Model, DataTypes } = require('sequelize');

// Resolves Staff<->Booking, added here in full — see the migration's
// comment for why this table exists at all (one of the two gaps flagged
// in the Task 1 -> Task 2 handoff).
module.exports = (sequelize) => {
  class StaffAssignment extends Model {
    static associate(models) {
      StaffAssignment.belongsTo(models.Staff, { foreignKey: 'staffId' });
      StaffAssignment.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  StaffAssignment.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      staffId: { type: DataTypes.UUID, allowNull: false },
      bookingId: { type: DataTypes.UUID, allowNull: false },
      assignmentRole: { type: DataTypes.STRING, allowNull: true },
      assignedAt: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM('assigned', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'assigned',
      },
    },
    { sequelize, modelName: 'StaffAssignment', tableName: 'staff_assignments' }
  );

  return StaffAssignment;
};
