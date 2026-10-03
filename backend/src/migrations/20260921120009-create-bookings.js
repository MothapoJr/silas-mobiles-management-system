'use strict';

// The central transactional entity (Section 9.1.9). status carries every
// state named across both the domain narrative (Pending/Confirmed/Active/
// Completed/Cancelled) AND the Booking Lifecycle state diagram's fuller
// picture (Disputed, Expired) — the state diagram is the more complete
// source for the full value set, so it wins where the two disagree.
//
// client_id is RESTRICT (never silently lose a client's booking history
// by deleting their account — POPIA erasure is handled by anonymising the
// Client/User row at the application layer, not by cascading through
// financial records). approved_by_admin_id is SET NULL instead — losing
// the record of *who* approved a booking if that admin account is later
// removed is a minor audit gap, not a reason to touch the booking itself.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('bookings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      approved_by_admin_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'administrators', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
      },
      booking_date: { type: Sequelize.DATEONLY, allowNull: false },
      total_cost: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('bookings', ['client_id']);
    await queryInterface.addIndex('bookings', ['approved_by_admin_id']);
    await queryInterface.addIndex('bookings', ['status']);
    await queryInterface.addIndex('bookings', ['booking_date']);

    await queryInterface.addConstraint('bookings', {
      fields: ['total_cost'],
      type: 'check',
      name: 'bookings_total_cost_non_negative',
      where: { total_cost: { [Sequelize.Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('bookings');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_bookings_status";');
  },
};
