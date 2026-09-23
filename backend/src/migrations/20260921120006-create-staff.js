'use strict';

// One deliberate departure from the Design Class Diagram's exact naming:
// its Staff box calls this attribute "role" (a job specialty — "Driver",
// "Setup Technician"). That collides in meaning with users.role_type
// (system access role — client/administrator/staff/finance_officer), so
// it's named job_role here instead. Same information, less confusing next
// to a column that means something entirely different one table over.
//
// availability is upgraded from the diagram's plain String to an ENUM —
// staff assignment logic needs to query "who's available", and a free-text
// field invites values that don't quite match ("Off" vs "on leave" vs
// "unavailable") breaking exactly that query.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      job_role: { type: Sequelize.STRING, allowNull: true },
      vehicle_license: { type: Sequelize.STRING, allowNull: true },
      availability: {
        type: Sequelize.ENUM('available', 'unavailable', 'on_leave'),
        allowNull: false,
        defaultValue: 'available',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('staff', ['availability']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('staff');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_staff_availability";');
  },
};
