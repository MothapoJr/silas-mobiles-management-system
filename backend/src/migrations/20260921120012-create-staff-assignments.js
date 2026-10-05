'use strict';

// Resolves the Staff<->Booking many-to-many ("Booking 0..* -- 0..* Staff:
// assigned to" in the ERD relationship list). This is the other gap the
// Task 1→2 handoff flagged: the class appears in the Section 9.1.9
// narrative and diagram description, but never made it into the actual
// diagram code — added properly here as its own table with a surrogate
// key, since "the staff member's specific role at a given event and the
// date of assignment" (the domain narrative's own description of this
// class) are real attributes of the *assignment*, not just a join.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff_assignments', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      staff_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'staff', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // keep the assignment history even if a staff record is later removed
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      assignment_role: { type: Sequelize.STRING, allowNull: true },
      assigned_at: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM('assigned', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'assigned',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('staff_assignments', ['staff_id']);
    // Also the uniqueness constraint: one staff member is assigned to a
    // given booking once, not as several duplicate rows.
    await queryInterface.addIndex('staff_assignments', ['staff_id', 'booking_id'], {
      unique: true,
      name: 'staff_assignments_staff_booking_unique',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('staff_assignments');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_staff_assignments_status";');
  },
};
