'use strict';

// One demo user per role, so every dashboard has someone to log in as
// once T11 (Auth) exists. Deliberately uses @silasmobiles.local rather
// than the client's real inbox from the project brief — seed data that
// could plausibly get pushed to a shared repo shouldn't reference anyone's
// actual contact details, demo or not.
//
// password_hash is a clearly-labelled placeholder, not a real bcrypt hash
// — nothing can log in as these users until T11 replaces it with the
// genuine article. Seeding a fake-looking hash on purpose so nobody
// mistakes this for working auth in the meantime.
const USER = {
  ADMIN: '00000000-0000-4000-8000-000000000001',
  CLIENT: '00000000-0000-4000-8000-000000000002',
  STAFF: '00000000-0000-4000-8000-000000000003',
  FINANCE: '00000000-0000-4000-8000-000000000004',
};

const PLACEHOLDER_HASH = 'SEED-DATA-NOT-A-REAL-BCRYPT-HASH-REPLACE-IN-T11';

module.exports = {
  ids: { USER },

  async up(queryInterface) {
    const now = new Date();
    const stamp = (row) => ({ ...row, created_at: now, updated_at: now });

    await queryInterface.bulkInsert(
      'users',
      [
        { id: USER.ADMIN, username: 'admin.demo', email: 'admin@silasmobiles.local', password_hash: PLACEHOLDER_HASH, role_type: 'administrator', is_active: true },
        { id: USER.CLIENT, username: 'client.demo', email: 'client@silasmobiles.local', password_hash: PLACEHOLDER_HASH, role_type: 'client', is_active: true },
        { id: USER.STAFF, username: 'staff.demo', email: 'staff@silasmobiles.local', password_hash: PLACEHOLDER_HASH, role_type: 'staff', is_active: true },
        { id: USER.FINANCE, username: 'finance.demo', email: 'finance@silasmobiles.local', password_hash: PLACEHOLDER_HASH, role_type: 'finance_officer', is_active: true },
      ].map(stamp),
      {}
    );

    await queryInterface.bulkInsert(
      'administrators',
      [stamp({ id: USER.ADMIN, department: 'Operations', access_level: 'full' })],
      {}
    );

    await queryInterface.bulkInsert(
      'clients',
      [
        stamp({
          id: USER.CLIENT,
          name: 'Thandiwe Events & Co',
          contact_details: '082 555 0134',
          address: '14 Jacaranda Street, Brooklyn, Pretoria',
          company_name: 'Thandiwe Events & Co',
        }),
      ],
      {}
    );

    await queryInterface.bulkInsert(
      'staff',
      [
        stamp({
          id: USER.STAFF,
          job_role: 'Setup Technician',
          vehicle_license: 'Code 10',
          availability: 'available',
        }),
      ],
      {}
    );

    await queryInterface.bulkInsert(
      'finance_officers',
      [stamp({ id: USER.FINANCE, department: 'Finance' })],
      {}
    );
  },

  async down(queryInterface) {
    // Child rows (administrators/clients/staff/finance_officers) cascade
    // from users being deleted — see each table's onDelete in its
    // migration — so deleting users alone is enough here.
    await queryInterface.bulkDelete('users', null, {});
  },
};
