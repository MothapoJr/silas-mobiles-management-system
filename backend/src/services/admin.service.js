'use strict';

const { getModels } = require('../models');
const notificationObserver = require('./notification.observer');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const BOOKING_STATUSES = ['pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed', 'expired'];
const EQUIPMENT_STATUSES = ['available', 'reserved', 'active_deployment', 'maintenance', 'retired'];
const QUOTE_STATUSES = ['draft', 'sent', 'accepted', 'rejected'];

// ---------- Bookings (all clients) ----------

async function listBookings({ status } = {}) {
  const { Booking, Event, BookingItem, Equipment, Client, User } = getModels();
  const where = {};
  if (status) {
    if (!BOOKING_STATUSES.includes(status)) {
      throw httpError(400, `Invalid booking status filter: ${status}`);
    }
    where.status = status;
  }

  return Booking.findAll({
    where,
    include: [
      {
        model: Client,
        include: [{ model: User, attributes: ['id', 'username', 'email'] }],
      },
      { model: Event },
      {
        model: BookingItem,
        include: [{ model: Equipment, attributes: ['id', 'name', 'dailyRate', 'status'] }],
      },
    ],
    order: [['bookingDate', 'DESC']],
  });
}

async function getBooking(bookingId) {
  const { Booking, Event, BookingItem, Equipment, Client, User, Administrator } = getModels();
  const booking = await Booking.findByPk(bookingId, {
    include: [
      {
        model: Client,
        include: [{ model: User, attributes: ['id', 'username', 'email'] }],
      },
      { model: Event },
      {
        model: BookingItem,
        include: [{ model: Equipment, attributes: ['id', 'name', 'dailyRate', 'status'] }],
      },
      {
        model: Administrator,
        as: 'approvedByAdmin',
        required: false,
      },
    ],
  });
  if (!booking) throw httpError(404, 'Booking not found');
  return booking;
}

/**
 * Approve a pending booking (Administrator.approveBooking).
 * Sets status → confirmed and records approvedByAdminId.
 * Marks linked equipment as reserved when still available.
 */
async function approveBooking(adminId, bookingId) {
  const { Booking, BookingItem, Equipment, sequelize } = getModels();

  await sequelize.transaction(async (t) => {
    const booking = await Booking.findByPk(bookingId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!booking) throw httpError(404, 'Booking not found');
    if (booking.status !== 'pending') {
      throw httpError(400, `Only pending bookings can be approved (current status: "${booking.status}")`);
    }

    await booking.update(
      {
        status: 'confirmed',
        approvedByAdminId: adminId,
      },
      { transaction: t }
    );

    const items = await BookingItem.findAll({
      where: { bookingId: booking.id },
      transaction: t,
    });

    for (const item of items) {
      const equipment = await Equipment.findByPk(item.equipmentId, { transaction: t });
      if (equipment && equipment.status === 'available') {
        await equipment.update({ status: 'reserved' }, { transaction: t });
      }
    }
 
    try {
      require('./notification.observer').emitBookingStatusChanged({
        bookingId: booking.id,
        clientId: booking.clientId,
        previousStatus: 'pending',
        newStatus: 'confirmed',
        actorUserId: adminId,
      });
    } catch (err) {
      console.error('[admin.service] emit failed', err.message);
    }
  });

  return getBooking(bookingId);
}
/**
 * Reject a pending booking (Administrator.rejectBooking).
 * Sets status → cancelled. Does not touch equipment (never reserved).
 */
async function rejectBooking(adminId, bookingId, { reason } = {}) {
  const { Booking, sequelize } = getModels();

  await sequelize.transaction(async (t) => {
    const booking = await Booking.findByPk(bookingId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!booking) throw httpError(404, 'Booking not found');
    if (booking.status !== 'pending') {
      throw httpError(400, `Only pending bookings can be rejected (current status: "${booking.status}")`);
    }

    void reason;

    await booking.update({ status: 'cancelled' }, { transaction: t });

    try {
      require('./notification.observer').emitBookingStatusChanged({
        bookingId: booking.id,
        clientId: booking.clientId,
        previousStatus: 'pending',
        newStatus: 'cancelled',
        actorUserId: adminId,
      });
    } catch (err) {
      console.error('[admin.service] emit failed', err.message);
    }
  });

  return getBooking(bookingId);
}

// ---------- Equipment (Administrator.manageEquipment) ----------

async function listEquipment({ status } = {}) {
  const { Equipment, EquipmentCategory } = getModels();
  const where = {};
  if (status) {
    if (!EQUIPMENT_STATUSES.includes(status)) {
      throw httpError(400, `Invalid equipment status filter: ${status}`);
    }
    where.status = status;
  }

  return Equipment.findAll({
    where,
    include: [{ model: EquipmentCategory, attributes: ['id', 'categoryName'] }],
    order: [['name', 'ASC']],
  });
}

async function getEquipment(equipmentId) {
  const { Equipment, EquipmentCategory } = getModels();
  const equipment = await Equipment.findByPk(equipmentId, {
    include: [{ model: EquipmentCategory, attributes: ['id', 'categoryName', 'description'] }],
  });
  if (!equipment) throw httpError(404, 'Equipment not found');
  return equipment;
}

async function createEquipment({ categoryId, name, dailyRate, description, status }) {
  const { Equipment, EquipmentCategory } = getModels();

  if (!categoryId) throw httpError(400, 'categoryId is required');
  if (!name || !String(name).trim()) throw httpError(400, 'name is required');
  if (dailyRate === undefined || dailyRate === null || Number(dailyRate) < 0) {
    throw httpError(400, 'dailyRate must be a non-negative number');
  }

  const category = await EquipmentCategory.findByPk(categoryId);
  if (!category) throw httpError(400, `Equipment category not found: ${categoryId}`);

  const equipmentStatus = status || 'available';
  if (!EQUIPMENT_STATUSES.includes(equipmentStatus)) {
    throw httpError(400, `Invalid equipment status: ${equipmentStatus}`);
  }

  const equipment = await Equipment.create({
    categoryId,
    name: String(name).trim(),
    dailyRate: Number(dailyRate),
    description: description ?? null,
    status: equipmentStatus,
  });

  return getEquipment(equipment.id);
}

async function updateEquipment(equipmentId, { categoryId, name, dailyRate, description, status }) {
  const { Equipment, EquipmentCategory } = getModels();
  const equipment = await Equipment.findByPk(equipmentId);
  if (!equipment) throw httpError(404, 'Equipment not found');

  if (categoryId !== undefined) {
    const category = await EquipmentCategory.findByPk(categoryId);
    if (!category) throw httpError(400, `Equipment category not found: ${categoryId}`);
  }
  if (status !== undefined && !EQUIPMENT_STATUSES.includes(status)) {
    throw httpError(400, `Invalid equipment status: ${status}`);
  }
  if (dailyRate !== undefined && Number(dailyRate) < 0) {
    throw httpError(400, 'dailyRate must be a non-negative number');
  }

  await equipment.update({
    categoryId: categoryId !== undefined ? categoryId : equipment.categoryId,
    name: name !== undefined ? String(name).trim() : equipment.name,
    dailyRate: dailyRate !== undefined ? Number(dailyRate) : equipment.dailyRate,
    description: description !== undefined ? description : equipment.description,
    status: status !== undefined ? status : equipment.status,
  });

  return getEquipment(equipmentId);
}

// ---------- Services ----------

async function listServices() {
  const { Service } = getModels();
  return Service.findAll({ order: [['serviceName', 'ASC']] });
}

async function createService({ serviceName, description, basePrice }) {
  const { Service } = getModels();

  if (!serviceName || !String(serviceName).trim()) {
    throw httpError(400, 'serviceName is required');
  }
  if (basePrice === undefined || basePrice === null || Number(basePrice) < 0) {
    throw httpError(400, 'basePrice must be a non-negative number');
  }

  const service = await Service.create({
    serviceName: String(serviceName).trim(),
    description: description ?? null,
    basePrice: Number(basePrice),
  });

  return service;
}

async function updateService(serviceId, { serviceName, description, basePrice }) {
  const { Service } = getModels();
  const service = await Service.findByPk(serviceId);
  if (!service) throw httpError(404, 'Service not found');

  if (basePrice !== undefined && Number(basePrice) < 0) {
    throw httpError(400, 'basePrice must be a non-negative number');
  }

  await service.update({
    serviceName: serviceName !== undefined ? String(serviceName).trim() : service.serviceName,
    description: description !== undefined ? description : service.description,
    basePrice: basePrice !== undefined ? Number(basePrice) : service.basePrice,
  });

  return service;
}

// ---------- Quotes (admin can list + transition status) ----------

async function listQuotes({ status } = {}) {
  const { Quote, QuoteItem, Service, Client, User } = getModels();
  const where = {};
  if (status) {
    if (!QUOTE_STATUSES.includes(status)) {
      throw httpError(400, `Invalid quote status filter: ${status}`);
    }
    where.status = status;
  }

  return Quote.findAll({
    where,
    include: [
      {
        model: Client,
        include: [{ model: User, attributes: ['id', 'username', 'email'] }],
      },
      {
        model: QuoteItem,
        include: [{ model: Service, attributes: ['id', 'serviceName', 'basePrice'] }],
      },
    ],
    order: [['quoteDate', 'DESC']],
  });
}

async function getQuote(quoteId) {
  const { Quote, QuoteItem, Service, Client, User } = getModels();
  const quote = await Quote.findByPk(quoteId, {
    include: [
      {
        model: Client,
        include: [{ model: User, attributes: ['id', 'username', 'email'] }],
      },
      {
        model: QuoteItem,
        include: [{ model: Service, attributes: ['id', 'serviceName', 'basePrice'] }],
      },
    ],
  });
  if (!quote) throw httpError(404, 'Quote not found');
  return quote;
}

/**
 * Transition quote status (draft → sent → accepted | rejected).
 * Allowed transitions:
 *   draft  → sent
 *   sent   → accepted | rejected
 *   accepted / rejected are terminal for admin transitions here.
 */
async function updateQuoteStatus(quoteId, status) {
  if (!QUOTE_STATUSES.includes(status)) {
    throw httpError(400, `Invalid quote status: ${status}`);
  }

  const quote = await getQuote(quoteId);
  const current = quote.status;

  const allowed = {
    draft: ['sent'],
    sent: ['accepted', 'rejected'],
    accepted: [],
    rejected: [],
  };

  if (!allowed[current]?.includes(status)) {
    throw httpError(400, `Cannot change quote status from "${current}" to "${status}"`);
  }

  await quote.update({ status });
  return getQuote(quoteId);
}

// ---------- Categories (read helper for equipment forms) ----------

async function listCategories() {
  const { EquipmentCategory } = getModels();
  return EquipmentCategory.findAll({ order: [['categoryName', 'ASC']] });
}

// ---------- Staff & assignments (Administrator.assignStaff) ----------

const ASSIGNMENT_STATUSES = ['assigned', 'completed', 'cancelled'];
const ASSIGNABLE_BOOKING_STATUSES = ['confirmed', 'active'];

/**
 * List all staff profiles (for the admin assign-staff picker).
 * Optional ?availability=available|unavailable|on_leave
 */
async function listStaff({ availability } = {}) {
  const { Staff, User } = getModels();
  const where = {};
  if (availability) {
    if (!['available', 'unavailable', 'on_leave'].includes(availability)) {
      throw httpError(400, `Invalid availability filter: ${availability}`);
    }
    where.availability = availability;
  }

  return Staff.findAll({
    where,
    include: [
      { model: User, attributes: ['id', 'username', 'email', 'roleType', 'isActive'] },
    ],
    order: [['jobRole', 'ASC']],
  });
}

/**
 * List staff assignments across the organisation.
 * Optional ?status=assigned|completed|cancelled and ?bookingId=
 */
async function listAssignments({ status, bookingId } = {}) {
  const {
    StaffAssignment,
    Staff,
    User,
    Booking,
    Event,
    BookingItem,
    Equipment,
    Client,
  } = getModels();

  const where = {};
  if (status) {
    if (!ASSIGNMENT_STATUSES.includes(status)) {
      throw httpError(400, `Invalid assignment status filter: ${status}`);
    }
    where.status = status;
  }
  if (bookingId) {
    where.bookingId = bookingId;
  }

  return StaffAssignment.findAll({
    where,
    include: [
      {
        model: Staff,
        include: [
          { model: User, attributes: ['id', 'username', 'email'] },
        ],
      },
      {
        model: Booking,
        include: [
          { model: Event },
          {
            model: Client,
            include: [{ model: User, attributes: ['id', 'username', 'email'] }],
          },
          {
            model: BookingItem,
            include: [{ model: Equipment, attributes: ['id', 'name', 'status', 'dailyRate'] }],
          },
        ],
      },
    ],
    order: [['assignedAt', 'DESC']],
  });
}

/**
 * Assign a staff member to a confirmed (or active) booking.
 * Body: { staffId, bookingId, assignmentRole? }
 * Prevents duplicate active assignments of the same staff to the same booking.
 */
async function assignStaff(adminId, { staffId, bookingId, assignmentRole } = {}) {
  void adminId;
  if (!staffId) throw httpError(400, 'staffId is required');
  if (!bookingId) throw httpError(400, 'bookingId is required');

  const { Staff, StaffAssignment, Booking, sequelize } = getModels();

  let createdId;
  await sequelize.transaction(async (t) => {
    const booking = await Booking.findByPk(bookingId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!booking) throw httpError(404, 'Booking not found');
    if (!ASSIGNABLE_BOOKING_STATUSES.includes(booking.status)) {
      throw httpError(
        400,
        `Only confirmed or active bookings can be assigned staff (current status: "${booking.status}")`
      );
    }

    const staff = await Staff.findByPk(staffId, { transaction: t });
    if (!staff) throw httpError(404, 'Staff member not found');

    const existing = await StaffAssignment.findOne({
      where: {
        staffId,
        bookingId,
        status: 'assigned',
      },
      transaction: t,
    });
    if (existing) {
      throw httpError(409, 'This staff member is already assigned to this booking');
    }

    const today = new Date().toISOString().slice(0, 10);
    const row = await StaffAssignment.create(
      {
        staffId,
        bookingId,
        assignmentRole: assignmentRole || staff.jobRole || 'Field staff',
        assignedAt: today,
        status: 'assigned',
      },
      { transaction: t }
    );
    createdId = row.id;
  });

  const all = await listAssignments({});
  const created = all.find((a) => a.id === createdId);
  if (!created) {
    // Fallback if include shape differs after create
    const { StaffAssignment, Staff, User, Booking, Event } = getModels();
    return StaffAssignment.findByPk(createdId, {
      include: [
        { model: Staff, include: [{ model: User, attributes: ['id', 'username', 'email'] }] },
        { model: Booking, include: [{ model: Event }] },
      ],
    });
  }
  return created;
}

module.exports = {
  listBookings,
  getBooking,
  approveBooking,
  rejectBooking,
  listEquipment,
  getEquipment,
  createEquipment,
  updateEquipment,
  listServices,
  createService,
  updateService,
  listQuotes,
  getQuote,
  updateQuoteStatus,
  listCategories,
  listStaff,
  listAssignments,
  assignStaff,
};