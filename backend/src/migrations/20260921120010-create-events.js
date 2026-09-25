'use strict';

// "Each booking has exactly one associated event" (Section 9.1.9) is a
// true 1:1, not 1:many — enforced here with a UNIQUE constraint on
// booking_id, not just a foreign key. Composition, so CASCADE: an Event
// has no meaning once its Booking is gone.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('events', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      venue: { type: Sequelize.STRING, allowNull: false },
      guest_count: { type: Sequelize.INTEGER, allowNull: true },
      setup_time: { type: Sequelize.DATE, allowNull: true },
      // Not in the Design Class Diagram's code, but the domain narrative
      // explicitly says Event captures "setup/breakdown times" (plural) —
      // filling in the half the diagram code dropped.
      breakdown_time: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addConstraint('events', {
      fields: ['guest_count'],
      type: 'check',
      name: 'events_guest_count_non_negative',
      where: { guest_count: { [Sequelize.Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('events');
  },
};
