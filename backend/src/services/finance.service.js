'use strict';

const { getModels } = require('../models');
const { createInvoice: factoryCreate, TYPES } = require('./invoice.factory');

const PAYMENT_STATUSES = new Set(['unpaid', 'partial', 'paid']);

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

/**
 * List invoices, newest first.
 * @param {{ paymentStatus?: string }} [filters]
 */
async function listInvoices(filters = {}) {
  const { Invoice, Booking, Client, User } = getModels();
  const where = {};

  if (filters.paymentStatus) {
    if (!PAYMENT_STATUSES.has(filters.paymentStatus)) {
      throw httpError(400, `paymentStatus must be one of: ${[...PAYMENT_STATUSES].join(', ')}`);
    }
    where.paymentStatus = filters.paymentStatus;
  }

  return Invoice.findAll({
    where,
    include: [
      {
        model: Booking,
        attributes: ['id', 'status', 'totalCost', 'bookingDate', 'clientId'],
        include: [
          {
            model: Client,
            attributes: ['id'],
            include: [{ model: User, attributes: ['id', 'email', 'username'] }],
          },
        ],
      },
    ],
    order: [['issueDate', 'DESC'], ['createdAt', 'DESC']],
  });
}

/**
 * Single invoice with booking context.
 */
async function getInvoice(id) {
  const { Invoice, Booking, Client, User, BookingItem, Event } = getModels();

  const invoice = await Invoice.findByPk(id, {
    include: [
      {
        model: Booking,
        include: [
          {
            model: Client,
            attributes: ['id'],
            include: [{ model: User, attributes: ['id', 'email', 'username'] }],
          },
          { model: BookingItem },
          { model: Event },
        ],
      },
    ],
  });

  if (!invoice) throw httpError(404, 'Invoice not found');
  return invoice;
}

/**
 * Create an invoice for a booking via the Factory.
 * body: { bookingId, type?, amount?, paymentMethod?, dueInDays? }
 */
async function createInvoiceForBooking(body = {}) {
  const { Booking, Invoice } = getModels();
  const { bookingId, type = TYPES.STANDARD, amount, paymentMethod, dueInDays } = body;

  if (!bookingId) throw httpError(400, 'bookingId is required');

  const booking = await Booking.findByPk(bookingId);
  if (!booking) throw httpError(404, 'Booking not found');

  // Only confirmed/active/completed bookings should be invoiced
  const allowed = new Set(['confirmed', 'active', 'completed']);
  if (!allowed.has(booking.status)) {
    throw httpError(
      400,
      `Cannot invoice a booking with status "${booking.status}". Allowed: ${[...allowed].join(', ')}`
    );
  }

  const fields = factoryCreate(type, booking, { amount, paymentMethod, dueInDays });
  const invoice = await Invoice.create(fields);
  return getInvoice(invoice.id);
}

/**
 * Update payment status (and optional method).
 * body: { paymentStatus, paymentMethod? }
 */
async function markInvoicePayment(id, body = {}) {
  const { Invoice } = getModels();
  const { paymentStatus, paymentMethod } = body;

  if (!paymentStatus || !PAYMENT_STATUSES.has(paymentStatus)) {
    throw httpError(
      400,
      `paymentStatus is required and must be one of: ${[...PAYMENT_STATUSES].join(', ')}`
    );
  }

  const invoice = await Invoice.findByPk(id);
  if (!invoice) throw httpError(404, 'Invoice not found');

  invoice.paymentStatus = paymentStatus;
  if (paymentMethod !== undefined) {
    invoice.paymentMethod = paymentMethod;
  }
  await invoice.save();

  return getInvoice(invoice.id);
}

/**
 * Simple finance summary: counts + totals grouped by paymentStatus.
 */
async function getSummary() {
  const { Invoice, sequelize } = getModels();

  const rows = await Invoice.findAll({
    attributes: [
      'paymentStatus',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('COALESCE', sequelize.fn('SUM', sequelize.col('amount')), 0), 'totalAmount'],
    ],
    group: ['paymentStatus'],
    raw: true,
  });

  const byStatus = {
    unpaid: { count: 0, totalAmount: 0 },
    partial: { count: 0, totalAmount: 0 },
    paid: { count: 0, totalAmount: 0 },
  };

  for (const row of rows) {
    const key = row.paymentStatus;
    if (byStatus[key]) {
      byStatus[key] = {
        count: Number(row.count),
        totalAmount: Number(row.totalAmount),
      };
    }
  }

  const overall = {
    count: Object.values(byStatus).reduce((s, x) => s + x.count, 0),
    totalAmount: Object.values(byStatus).reduce((s, x) => s + x.totalAmount, 0),
  };

  return { byStatus, overall };
}

module.exports = {
  listInvoices,
  getInvoice,
  createInvoiceForBooking,
  markInvoicePayment,
  getSummary,
  TYPES,
};