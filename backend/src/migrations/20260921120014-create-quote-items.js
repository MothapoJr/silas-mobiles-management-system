'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('quote_items', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      quote_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'quotes', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      service_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'services', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      unit_price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('quote_items', ['quote_id']);
    await queryInterface.addIndex('quote_items', ['service_id']);

    await queryInterface.addConstraint('quote_items', {
      fields: ['quantity'],
      type: 'check',
      name: 'quote_items_quantity_positive',
      where: { quantity: { [Sequelize.Op.gt]: 0 } },
    });
    await queryInterface.addConstraint('quote_items', {
      fields: ['unit_price'],
      type: 'check',
      name: 'quote_items_unit_price_non_negative',
      where: { unit_price: { [Sequelize.Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('quote_items');
  },
};
