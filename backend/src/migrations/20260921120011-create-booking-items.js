'use strict';

// Resolves the Booking<->Equipment many-to-many (Section 9.1.9).
//
// Two deliberate additions beyond the Design Class Diagram, the second
// found by actually running seed data through this table rather than by
// inspection:
//
// 1. unit_price_at_booking snapshots equipment.daily_rate at the moment
//    the item is added, so a later catalogue price change can never
//    silently alter the cost of a Booking that's already confirmed or
//    invoiced — the "financial records must remain consistent"
//    requirement from the Data Integrity NFR (Section 9.1.8).
//
// 2. The diagram's single `usageDate` only fits a one-day rental. Silas
//    Mobiles' own Event model has separate setup and breakdown times —
//    this is a multi-day-rental business — so a single date can't
//    actually price a real booking correctly. rental_start_date /
//    rental_end_date replace it, and line_total (quantity × unit price ×
//    number of days, computed once and stored — same snapshot reasoning
//    as unit_price_at_booking) is what a Booking's total_cost actually
//    sums, rather than every caller re-deriving it from three other
//    columns.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('booking_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      equipment_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // preserve historical line items even if this equipment is later retired
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      rental_start_date: { type: Sequelize.DATEONLY, allowNull: false },
      rental_end_date: { type: Sequelize.DATEONLY, allowNull: false },
      unit_price_at_booking: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      line_total: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('booking_items', ['booking_id']);
    await queryInterface.addIndex('booking_items', ['equipment_id']);

    await queryInterface.addConstraint('booking_items', {
      fields: ['quantity'],
      type: 'check',
      name: 'booking_items_quantity_positive',
      where: { quantity: { [Sequelize.Op.gt]: 0 } },
    });
    await queryInterface.addConstraint('booking_items', {
      fields: ['unit_price_at_booking'],
      type: 'check',
      name: 'booking_items_unit_price_non_negative',
      where: { unit_price_at_booking: { [Sequelize.Op.gte]: 0 } },
    });
    await queryInterface.addConstraint('booking_items', {
      fields: ['line_total'],
      type: 'check',
      name: 'booking_items_line_total_non_negative',
      where: { line_total: { [Sequelize.Op.gte]: 0 } },
    });
    await queryInterface.addConstraint('booking_items', {
      fields: ['rental_start_date', 'rental_end_date'],
      type: 'check',
      name: 'booking_items_end_not_before_start',
      where: Sequelize.literal('"rental_end_date" >= "rental_start_date"'),
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('booking_items');
  },
};
