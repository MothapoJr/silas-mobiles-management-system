'use strict';

// This class exists in the domain narrative and the User Roles table
// (Section 9.1.6 — "Moderate access: financial modules, invoices, and
// reporting tools only") but was never modelled in the Design Class
// Diagram code at all — one of the two gaps the Task 1→2 handoff flagged
// as needing reconciling before the schema locked in. Kept deliberately
// minimal (mirrors Administrator's shape) since nothing more specific was
// ever specified; easy to extend once T12+ needs more from it.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('finance_officers', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      department: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('finance_officers');
  },
};
