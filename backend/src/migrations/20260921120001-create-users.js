'use strict';

// Base authentication table — the "supertype for all system users" from
// Section 9.1.9. role_type is the discriminator; the actual role-specific
// attributes live in the four extension tables created next (clients,
// administrators, staff, finance_officers), each sharing its primary key
// with the users row it extends. This is class-table inheritance rather
// than one wide table with a column per role — avoids a table where an
// Administrator row has permanently-null client/staff columns and vice
// versa, at the cost of one extra join to get role-specific fields.
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true },
      username: { type: Sequelize.STRING, allowNull: false, unique: true },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password_hash: { type: Sequelize.STRING, allowNull: false },
      role_type: {
        type: Sequelize.ENUM('client', 'administrator', 'staff', 'finance_officer'),
        allowNull: false,
      },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      last_login_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('users', ['role_type']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
    // Sequelize does not drop the Postgres ENUM type it created for an
    // ENUM column when the table is dropped — left behind, it collides
    // with "type already exists" the next time this migration runs up.
    // Every down() in this schema that drops a table with an ENUM column
    // cleans its type up explicitly for the same reason.
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_users_role_type";');
  },
};
