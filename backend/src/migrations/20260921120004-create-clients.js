'use strict';

// Extension table for User where role_type = 'client'. id is NOT
// independently generated — it is always supplied as the id of the users
// row it extends (see models/client.model.js), so this table's primary
// key doubles as its foreign key: a Client cannot exist without exactly
// one matching User, and deleting that User removes this row with it.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      name: { type: Sequelize.STRING, allowNull: false },
      contact_details: { type: Sequelize.STRING, allowNull: true },
      address: { type: Sequelize.TEXT, allowNull: true },
      // Not in the Design Class Diagram's Client box, but the diagram
      // explanation text says Client adds "contact and company details" —
      // company_name closes that gap for corporate clients specifically.
      company_name: { type: Sequelize.STRING, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('clients');
  },
};
