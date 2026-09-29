'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const adminService = require('../services/admin.service');

const router = express.Router();

// Every admin route requires a valid access token + administrator role
router.use(requireAuth, requireRole('administrator'));

function handle(fn) {
  return async (req, res, next) => {
    try {
      const data = await fn(req, res);
      if (data !== undefined) {
        return res.json(data);
      }
      return undefined;
    } catch (err) {
      if (err.status) {
        return res.status(err.status).json({ error: err.message });
      }
      return next(err);
    }
  };
}

// ---------- Bookings ----------

router.get(
  '/bookings',
  handle(async (req) => {
    const bookings = await adminService.listBookings({
      status: req.query.status || undefined,
    });
    return { bookings };
  })
);

router.get(
  '/bookings/:id',
  handle(async (req) => {
    const booking = await adminService.getBooking(req.params.id);
    return { booking };
  })
);

router.post(
  '/bookings/:id/approve',
  handle(async (req) => {
    const booking = await adminService.approveBooking(req.user.id, req.params.id);
    return { booking };
  })
);

router.post(
  '/bookings/:id/reject',
  handle(async (req) => {
    const booking = await adminService.rejectBooking(req.user.id, req.params.id, {
      reason: req.body?.reason,
    });
    return { booking };
  })
);

// ---------- Equipment ----------

router.get(
  '/equipment',
  handle(async (req) => {
    const equipment = await adminService.listEquipment({
      status: req.query.status || undefined,
    });
    return { equipment };
  })
);

router.get(
  '/equipment/:id',
  handle(async (req) => {
    const equipment = await adminService.getEquipment(req.params.id);
    return { equipment };
  })
);

router.post(
  '/equipment',
  handle(async (req) => {
    const equipment = await adminService.createEquipment(req.body || {});
    return { equipment };
  })
);

router.patch(
  '/equipment/:id',
  handle(async (req) => {
    const equipment = await adminService.updateEquipment(req.params.id, req.body || {});
    return { equipment };
  })
);

// ---------- Services ----------

router.get(
  '/services',
  handle(async () => {
    const services = await adminService.listServices();
    return { services };
  })
);

router.post(
  '/services',
  handle(async (req) => {
    const service = await adminService.createService(req.body || {});
    return { service };
  })
);

router.patch(
  '/services/:id',
  handle(async (req) => {
    const service = await adminService.updateService(req.params.id, req.body || {});
    return { service };
  })
);

// ---------- Quotes ----------

router.get(
  '/quotes',
  handle(async (req) => {
    const quotes = await adminService.listQuotes({
      status: req.query.status || undefined,
    });
    return { quotes };
  })
);

router.get(
  '/quotes/:id',
  handle(async (req) => {
    const quote = await adminService.getQuote(req.params.id);
    return { quote };
  })
);

router.patch(
  '/quotes/:id/status',
  handle(async (req) => {
    const status = req.body?.status;
    if (!status) {
      const err = new Error('status is required');
      err.status = 400;
      throw err;
    }
    const quote = await adminService.updateQuoteStatus(req.params.id, status);
    return { quote };
  })
);

// ---------- Categories (helper for equipment forms) ----------

router.get(
  '/categories',
  handle(async () => {
    const categories = await adminService.listCategories();
    return { categories };
  })
);

module.exports = router;