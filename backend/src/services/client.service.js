'use strict';

const { getModels } = require('../models');
const notificationObserver = require('./notification.observer');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const ms = e.getTime() - s.getTime();
  const days = Math.ceil(ms / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
}

// ---------- Profile ----------

async function getProfile(userId) {
  const { Client, User } = getModels();
  const client = await Client.findByPk(userId, {
    include: [{ model: User, attributes: ['id', 'username', 'email', 'roleType', 'isActive'] }],
  });
  if (!client) throw httpError(404, 'Client profile not found');
  return client;
}

async function updateProfile(userId, { name, contactDetails, address, companyName }) {
  const { Client } = getModels();
  const client = await Client.findByPk(userId);
  if (!client) throw httpError(404, 'Client profile not found');

  await client.update({
    name: name ?? client.name,
    contactDetails: contactDetails !== undefined ? contactDetails : client.contactDetails,
    address: address !== undefined ? address : client.address,
    companyName: companyName !== undefined ? companyName : client.companyName,
  });

  return getProfile(userId);
}

// ---------- Catalogue (read-only for clients) ----------

async function listEquipment() {
  const { Equipment, EquipmentCategory } = getModels();
  return Equipment.findAll({
    where: { status: 'available' },
    include: [{ model: EquipmentCategory, attributes: ['id', 'categoryName'] }],
    order: [['name', 'ASC']],
  });
}

async function listServices() {
  const { Service } = getModels();
  return Service.findAll({ order: [['serviceName', 'ASC']] });
}

// ---------- Quotes ----------

async function listQuotes(clientId) {
  const { Quote, QuoteItem, Service } = getModels();
  return Quote.findAll({
    where: { clientId },
    include: [
      {
        model: QuoteItem,
        include: [{ model: Service, attributes: ['id', 'serviceName', 'basePrice'] }],
      },
    ],
    order: [['quoteDate', 'DESC']],
  });
}

async function getQuote(clientId, quoteId) {
  const { Quote, QuoteItem, Service } = getModels();
  const quote = await Quote.findOne({
    where: { id: quoteId, clientId },
    include: [
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
 * Create a quote request.
 * body: { items: [{ serviceId, quantity }] }
 */
async function createQuote(clientId, { items }) {
  const { Quote, QuoteItem, Service, sequelize } = getModels();

  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'items must be a non-empty array');
  }

  const createdId = await sequelize.transaction(async (t) => {
    let totalEstimate = 0;
    const resolved = [];

    for (const row of items) {
      const service = await Service.findByPk(row.serviceId, { transaction: t });
      if (!service) throw httpError(400, `Service not found: ${row.serviceId}`);
      const quantity = Math.max(parseInt(row.quantity, 10) || 1, 1);
      const unitPrice = Number(service.basePrice);
      totalEstimate += unitPrice * quantity;
      resolved.push({ serviceId: service.id, quantity, unitPrice });
    }

    const quote = await Quote.create(
      {
        clientId,
        quoteDate: new Date().toISOString().slice(0, 10),
        status: 'draft',
        totalEstimate,
      },
      { transaction: t }
    );

    for (const r of resolved) {
      await QuoteItem.create(
        {
          quoteId: quote.id,
          serviceId: r.serviceId,
          quantity: r.quantity,
          unitPrice: r.unitPrice,
        },
        { transaction: t }
      );
    }

    return quote.id;
  });

  return getQuote(clientId, createdId);
}
// ---------- Bookings ----------

async function listBookings(clientId) {
  const { Booking, Event, BookingItem, Equipment } = getModels();
  return Booking.findAll({
    where: { clientId },
    include: [
      { model: Event },
      {
        model: BookingItem,
        include: [{ model: Equipment, attributes: ['id', 'name', 'dailyRate'] }],
      },
    ],
    order: [['bookingDate', 'DESC']],
  });
}

async function getBooking(clientId, bookingId) {
  const { Booking, Event, BookingItem, Equipment } = getModels();
  const booking = await Booking.findOne({
    where: { id: bookingId, clientId },
    include: [
      { model: Event },
      {
        model: BookingItem,
        include: [{ model: Equipment, attributes: ['id', 'name', 'dailyRate'] }],
      },
    ],
  });
  if (!booking) throw httpError(404, 'Booking not found');
  return booking;
}

/**
 * Create a booking with event + equipment line items.
 * body: {
 *   bookingDate,
 *   event: { venue, guestCount?, setupTime?, breakdownTime? },
 *   items: [{ equipmentId, quantity, rentalStartDate, rentalEndDate }]
 * }
 */
async function createBooking(clientId, { bookingDate, event, items }) {
  const { Booking, Event, BookingItem, Equipment, sequelize } = getModels();

  if (!bookingDate) throw httpError(400, 'bookingDate is required');
  if (!event?.venue) throw httpError(400, 'event.venue is required');
  if (!Array.isArray(items) || items.length === 0) {
    throw httpError(400, 'items must be a non-empty array');
  }

  const createdId = await sequelize.transaction(async (t) => {
    let totalCost = 0;
    const resolved = [];

    for (const row of items) {
      const equipment = await Equipment.findByPk(row.equipmentId, { transaction: t });
      if (!equipment) throw httpError(400, `Equipment not found: ${row.equipmentId}`);
      if (equipment.status !== 'available') {
        throw httpError(400, `Equipment not available: ${equipment.name}`);
      }
      if (!row.rentalStartDate || !row.rentalEndDate) {
        throw httpError(400, 'rentalStartDate and rentalEndDate are required on each item');
      }
      if (row.rentalEndDate < row.rentalStartDate) {
        throw httpError(400, 'rentalEndDate must be on or after rentalStartDate');
      }

      const quantity = Math.max(parseInt(row.quantity, 10) || 1, 1);
      const unitPrice = Number(equipment.dailyRate);
      const days = daysBetween(row.rentalStartDate, row.rentalEndDate);
      const lineTotal = unitPrice * quantity * days;
      totalCost += lineTotal;

      resolved.push({
        equipmentId: equipment.id,
        quantity,
        rentalStartDate: row.rentalStartDate,
        rentalEndDate: row.rentalEndDate,
        unitPriceAtBooking: unitPrice,
        lineTotal,
      });
    }

    const booking = await Booking.create(
      {
        clientId,
        bookingDate,
        status: 'pending',
        totalCost,
      },
      { transaction: t }
    );

    await Event.create(
      {
        bookingId: booking.id,
        venue: event.venue,
        guestCount: event.guestCount ?? null,
        setupTime: event.setupTime ?? null,
        breakdownTime: event.breakdownTime ?? null,
      },
      { transaction: t }
    );

    for (const r of resolved) {
      await BookingItem.create(
        {
          bookingId: booking.id,
          equipmentId: r.equipmentId,
          quantity: r.quantity,
          rentalStartDate: r.rentalStartDate,
          rentalEndDate: r.rentalEndDate,
          unitPriceAtBooking: r.unitPriceAtBooking,
          lineTotal: r.lineTotal,
        },
        { transaction: t }
      );
    }

    return booking.id;
  });

  return getBooking(clientId, createdId);
}

async function cancelBooking(clientId, bookingId) {
  const booking = await getBooking(clientId, bookingId);

  if (!['pending', 'confirmed'].includes(booking.status)) {
    throw httpError(400, `Cannot cancel a booking in status "${booking.status}"`);
  }

  const previousStatus = booking.status;
  await booking.update({ status: 'cancelled' });

   try {
    require('./notification.observer').emitBookingStatusChanged({
      bookingId: booking.id,
      clientId,
      previousStatus,
      newStatus: 'cancelled',
      actorUserId: clientId,
    });
  } catch (err) {
    console.error('[client.service] emit failed', err.message);
  }

  return getBooking(clientId, bookingId);
}

module.exports = {
  getProfile,
  updateProfile,
  listEquipment,
  listServices,
  listQuotes,
  getQuote,
  createQuote,
  listBookings,
  getBooking,
  createBooking,
  cancelBooking,
};