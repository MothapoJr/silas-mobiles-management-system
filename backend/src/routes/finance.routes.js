'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const financeService = require('../services/finance.service');

const router = express.Router();

// Every finance route: authenticated + finance_officer only
router.use(requireAuth, requireRole('finance_officer'));

/**
 * GET /api/finance/invoices?paymentStatus=unpaid|partial|paid
 */
router.get('/invoices', async (req, res, next) => {
  try {
    const invoices = await financeService.listInvoices({
      paymentStatus: req.query.paymentStatus,
    });
    res.json(invoices);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/finance/invoices/:id
 */
router.get('/invoices/:id', async (req, res, next) => {
  try {
    const invoice = await financeService.getInvoice(req.params.id);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/finance/invoices
 * body: { bookingId, type?, amount?, paymentMethod?, dueInDays? }
 */
router.post('/invoices', async (req, res, next) => {
  try {
    const invoice = await financeService.createInvoiceForBooking(req.body);
    res.status(201).json(invoice);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/finance/invoices/:id/pay
 * body: { paymentStatus, paymentMethod? }
 */
router.patch('/invoices/:id/pay', async (req, res, next) => {
  try {
    const invoice = await financeService.markInvoicePayment(req.params.id, req.body);
    res.json(invoice);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/finance/reports/summary
 */
router.get('/reports/summary', async (req, res, next) => {
  try {
    const summary = await financeService.getSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
});

module.exports = router;