'use strict';

// The Design Class Diagram gives Equipment two overlapping String fields —
// status and availability — without distinguishing what each means. The
// Equipment Status Lifecycle state diagram (Section 9.1.10) names the
// actual states this needs (RESERVED, ACTIVE_DEPLOYMENT, MAINTENANCE...),
// so the two are consolidated into one ENUM that implements that lifecycle
// properly, rather than carrying two ambiguous, possibly-contradictory
// string columns.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      category_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: 'equipment_categories', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT', // a category in active use can't be deleted out from under its equipment
      },
      name: { type: Sequelize.STRING, allowNull: false },
      status: {
        type: Sequelize.ENUM('available', 'reserved', 'active_deployment', 'maintenance', 'retired'),
        allowNull: false,
        defaultValue: 'available',
      },
      daily_rate: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('equipment', ['category_id']);
    await queryInterface.addIndex('equipment', ['status']);

    await queryInterface.addConstraint('equipment', {
      fields: ['daily_rate'],
      type: 'check',
      name: 'equipment_daily_rate_non_negative',
      where: { daily_rate: { [Sequelize.Op.gte]: 0 } },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('equipment');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_equipment_status";');
  },
};
