'use strict';

// type is left a plain String rather than an ENUM on purpose — the source
// documentation uses it ambiguously (sometimes implying delivery channel,
// "SMS/email", sometimes implying category, "booking status changes,
// payment confirmations, administrative alerts"). Locking that down with
// a guessed ENUM risks being concretely wrong in a way that blocks T14/T15;
// better decided once the Notification Service (Section 9.1.10, Flow 1) is
// actually built. status is a real, unambiguous small state set, so that
// one is an ENUM. The diagram's separate `timestamp` attribute is dropped
// favour of Sequelize's own created_at, which means the same thing.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      user_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      booking_id: {
        type: Sequelize.UUID,
        allowNull: true,
        references: { model: 'bookings', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      message: { type: Sequelize.TEXT, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: true },
      status: {
        type: Sequelize.ENUM('pending', 'sent', 'failed', 'read'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['booking_id']);
    await queryInterface.addIndex('notifications', ['status']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_notifications_status";');
  },
};
