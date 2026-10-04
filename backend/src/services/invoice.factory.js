'use strict';

/**
 * InvoiceFactory — Task 2 Factory pattern.
 *
 * createInvoice(type, booking, extras?) returns the field payload for
 * Invoice.create(...). New types can be added here without changing
 * finance.service or the routes (Open/Closed).
 *
 * Types:
 *   standard  — full booking total, unpaid
 *   partial   — partial amount (extras.amount required), unpaid/partial
 *   credit    — credit note (negative or zero-balance adjustment)
 */

const TYPES = Object.freeze({
  STANDARD: 'standard',
  PARTIAL: 'partial',
  CREDIT: 'credit',
});

function todayDateOnly() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(dateOnly, days) {
  const d = new Date(`${dateOnly}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * @param {'standard'|'partial'|'credit'} type
 * @param {{ id: string, totalCost: number|string }} booking
 * @param {{ amount?: number, paymentMethod?: string, dueInDays?: number }} [extras]
 * @returns {object} fields suitable for Invoice.create
 */
function createInvoice(type, booking, extras = {}) {
  if (!booking?.id) {
    const err = new Error('booking is required');
    err.status = 400;
    throw err;
  }

  const issueDate = todayDateOnly();
  const dueInDays = extras.dueInDays ?? 14;
  const dueDate = addDays(issueDate, dueInDays);
  const total = Number(booking.totalCost);

  switch (type) {
    case TYPES.STANDARD: {
      if (!Number.isFinite(total) || total < 0) {
        const err = new Error('booking.totalCost must be a non-negative number');
        err.status = 400;
        throw err;
      }
      return {
        bookingId: booking.id,
        amount: total,
        paymentMethod: extras.paymentMethod ?? null,
        paymentStatus: 'unpaid',
        issueDate,
        dueDate,
      };
    }

    case TYPES.PARTIAL: {
      const amount = Number(extras.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        const err = new Error('partial invoice requires a positive extras.amount');
        err.status = 400;
        throw err;
      }
      if (Number.isFinite(total) && amount > total) {
        const err = new Error('partial amount cannot exceed booking.totalCost');
        err.status = 400;
        throw err;
      }
      return {
        bookingId: booking.id,
        amount,
        paymentMethod: extras.paymentMethod ?? null,
        paymentStatus: 'partial',
        issueDate,
        dueDate,
      };
    }

    case TYPES.CREDIT: {
      // Credit note: amount is the credit value (stored positive; status unpaid
      // until applied). Caller may pass extras.amount; default = full total.
      const amount = extras.amount != null ? Number(extras.amount) : total;
      if (!Number.isFinite(amount) || amount < 0) {
        const err = new Error('credit amount must be a non-negative number');
        err.status = 400;
        throw err;
      }
      return {
        bookingId: booking.id,
        amount,
        paymentMethod: extras.paymentMethod ?? null,
        paymentStatus: 'unpaid',
        issueDate,
        dueDate,
      };
    }

    default: {
      const err = new Error(
        `Unknown invoice type "${type}". Use: ${Object.values(TYPES).join(', ')}`
      );
      err.status = 400;
      throw err;
    }
  }
}

module.exports = {
  TYPES,
  createInvoice,
};