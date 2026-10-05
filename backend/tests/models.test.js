// Integration tests against a real Postgres database — not mocked, because
// what actually needs proving here is that the migrations, the model
// definitions, and Sequelize's association config all agree with each
// other, which a mock can't tell you. Needs DB_HOST/DB_USERNAME/
// DB_PASSWORD/DB_NAME pointing at a database with migrations already
// applied (see package.json's "test" script and .github/workflows/ci.yml
// for how CI does this; locally, run `npm run db:migrate` against
// docker-compose's postgres service first).
//
// Every test runs inside a transaction that's always rolled back — no
// cleanup step, and tests can't interfere with each other or with the
// seeded demo data, however many times this file runs.
const { initModels, _resetForTests } = require('../src/models');

let sequelize, User, Client, EquipmentCategory, Equipment, Booking, BookingItem, Staff, StaffAssignment;

beforeAll(() => {
  _resetForTests();
  ({ sequelize, User, Client, EquipmentCategory, Equipment, Booking, BookingItem, Staff, StaffAssignment } =
    initModels({
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
    }));
});

afterAll(async () => {
  await sequelize.close();
});

async function withRollback(fn) {
  const t = await sequelize.transaction();
  try {
    await fn(t);
  } finally {
    await t.rollback();
  }
}

describe('User -> Client shared primary key', () => {
  it('gives the Client row the same id as the User it extends', async () => {
    await withRollback(async (t) => {
      const user = await User.create(
        {
          username: 'test.client.user',
          email: 'test.client@example.com',
          passwordHash: 'not-a-real-hash',
          roleType: 'client',
        },
        { transaction: t }
      );

      const client = await Client.create(
        { id: user.id, name: 'Test Events Co' },
        { transaction: t }
      );

      expect(client.id).toBe(user.id);
    });
  });
});

describe('Booking -> BookingItem -> Equipment chain', () => {
  it('creates a full chain and resolves it through eager-loaded associations', async () => {
    await withRollback(async (t) => {
      const category = await EquipmentCategory.create(
        { categoryName: 'Test Category' },
        { transaction: t }
      );
      const equipment = await Equipment.create(
        { categoryId: category.id, name: 'Test Tent', dailyRate: 100 },
        { transaction: t }
      );
      const user = await User.create(
        {
          username: 'test.booking.user',
          email: 'test.booking@example.com',
          passwordHash: 'not-a-real-hash',
          roleType: 'client',
        },
        { transaction: t }
      );
      const client = await Client.create({ id: user.id, name: 'Test Client' }, { transaction: t });
      const booking = await Booking.create(
        { clientId: client.id, bookingDate: '2027-01-10', totalCost: 300 },
        { transaction: t }
      );
      await BookingItem.create(
        {
          bookingId: booking.id,
          equipmentId: equipment.id,
          quantity: 1,
          rentalStartDate: '2027-01-10',
          rentalEndDate: '2027-01-13',
          unitPriceAtBooking: 100,
          lineTotal: 300,
        },
        { transaction: t }
      );

      const loaded = await Booking.findByPk(booking.id, {
        include: [{ model: BookingItem, include: [{ model: Equipment }] }],
        transaction: t,
      });

      expect(loaded.BookingItems).toHaveLength(1);
      expect(loaded.BookingItems[0].Equipment.name).toBe('Test Tent');
      expect(Number(loaded.BookingItems[0].lineTotal)).toBe(300);
    });
  });

  it('rejects a booking item where the rental ends before it starts', async () => {
    await withRollback(async (t) => {
      const category = await EquipmentCategory.create({ categoryName: 'Test Category 2' }, { transaction: t });
      const equipment = await Equipment.create(
        { categoryId: category.id, name: 'Test Heater', dailyRate: 50 },
        { transaction: t }
      );
      const user = await User.create(
        {
          username: 'test.constraint.user',
          email: 'test.constraint@example.com',
          passwordHash: 'not-a-real-hash',
          roleType: 'client',
        },
        { transaction: t }
      );
      const client = await Client.create({ id: user.id, name: 'Constraint Test Client' }, { transaction: t });
      const booking = await Booking.create(
        { clientId: client.id, bookingDate: '2027-02-01', totalCost: 50 },
        { transaction: t }
      );

      await expect(
        BookingItem.create(
          {
            bookingId: booking.id,
            equipmentId: equipment.id,
            quantity: 1,
            rentalStartDate: '2027-02-05',
            rentalEndDate: '2027-02-01', // before the start date — should be rejected
            unitPriceAtBooking: 50,
            lineTotal: 50,
          },
          { transaction: t }
        )
      ).rejects.toThrow();
    });
  });
});

describe('Staff <-> Booking many-to-many (through StaffAssignment)', () => {
  it('resolves the belongsToMany shortcut in both directions', async () => {
    await withRollback(async (t) => {
      const staffUser = await User.create(
        {
          username: 'test.staff.user',
          email: 'test.staff@example.com',
          passwordHash: 'not-a-real-hash',
          roleType: 'staff',
        },
        { transaction: t }
      );
      const staff = await Staff.create({ id: staffUser.id, jobRole: 'Test Driver' }, { transaction: t });

      const clientUser = await User.create(
        {
          username: 'test.m2m.client',
          email: 'test.m2m.client@example.com',
          passwordHash: 'not-a-real-hash',
          roleType: 'client',
        },
        { transaction: t }
      );
      const client = await Client.create({ id: clientUser.id, name: 'M2M Test Client' }, { transaction: t });
      const booking = await Booking.create(
        { clientId: client.id, bookingDate: '2027-03-01', totalCost: 0 },
        { transaction: t }
      );

      await StaffAssignment.create(
        { staffId: staff.id, bookingId: booking.id, assignedAt: '2027-02-28' },
        { transaction: t }
      );

      const assignedStaff = await booking.getAssignedStaff({ transaction: t });
      expect(assignedStaff.map((s) => s.id)).toContain(staff.id);

      const assignedBookings = await staff.getAssignedBookings({ transaction: t });
      expect(assignedBookings.map((b) => b.id)).toContain(booking.id);
    });
  });

  it('rejects a second identical assignment (same staff, same booking)', async () => {
    await withRollback(async (t) => {
      const staffUser = await User.create(
        {
          username: 'test.staff.dup',
          email: 'test.staff.dup@example.com',
          passwordHash: 'not-a-real-hash',
          roleType: 'staff',
        },
        { transaction: t }
      );
      const staff = await Staff.create({ id: staffUser.id }, { transaction: t });
      const clientUser = await User.create(
        {
          username: 'test.dup.client',
          email: 'test.dup.client@example.com',
          passwordHash: 'not-a-real-hash',
          roleType: 'client',
        },
        { transaction: t }
      );
      const client = await Client.create({ id: clientUser.id, name: 'Dup Test Client' }, { transaction: t });
      const booking = await Booking.create(
        { clientId: client.id, bookingDate: '2027-04-01', totalCost: 0 },
        { transaction: t }
      );

      await StaffAssignment.create(
        { staffId: staff.id, bookingId: booking.id, assignedAt: '2027-03-30' },
        { transaction: t }
      );

      await expect(
        StaffAssignment.create(
          { staffId: staff.id, bookingId: booking.id, assignedAt: '2027-03-30' },
          { transaction: t }
        )
      ).rejects.toThrow();
    });
  });
});
