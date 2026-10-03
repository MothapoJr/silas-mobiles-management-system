'use strict';

// booking_id is RESTRICT, deliberately stricter than most other FKs in
// this schema: an invoice is a financial record, and financial records
// should never disappear as a side effect of deleting something else —
// removing a booking that has an invoice has to be an explicit, visible
// decision, not a silent cascade.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('invoices', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      amount: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      // Not in the Design Class Diagram's code, but the Section 9.1.9
      // narrative explicitly says Invoice "records the amount due,
      // payment method, and payment status" — payment_method was missing.
      payment_method: { type: Sequelize.STRING, allowNull: true },
      payment_status: {
        type: Sequelize.ENUM('unpaid', 'partial', 'paid'),
        allowNull: false,
        defaultValue: 'unpaid',
      },
      issue_date: { type: Sequelize.DATEONLY, allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('invoices', ['booking_id']);
    await queryInterface.addIndex('invoices', ['payment_status']);

    await queryInterface.addConstraint('invoices', {
      fields: ['amount'],
      type: 'check',
      name: 'invoices_amount_non_negative',
      where: { amount: { [Sequelize.Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('invoices');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_invoices_payment_status";');
  },
};
