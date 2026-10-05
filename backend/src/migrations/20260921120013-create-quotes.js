'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quotes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'clients', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      // Traceability for Quote.convertToBooking() (Section 9.1.9) — set
      // once an accepted quote becomes a real booking. Nullable: most
      // quotes never convert, and the ones that do shouldn't vanish if
      // the resulting booking is later removed for some reason.
      converted_booking_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      quote_date: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM('draft', 'sent', 'accepted', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      total_estimate: { type: Sequelize.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('quotes', ['client_id']);
    await queryInterface.addIndex('quotes', ['status']);

    await queryInterface.addConstraint('quotes', {
      fields: ['total_estimate'],
      type: 'check',
      name: 'quotes_total_estimate_non_negative',
      where: { total_estimate: { [Sequelize.Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('quotes');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_quotes_status";');
  },
};
