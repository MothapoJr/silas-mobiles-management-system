'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const clientService = require('../services/client.service');

const router = express.Router();

// Every client route requires a valid access token + client role
router.use(requireAuth, requireRole('client'));

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

// ---------- Profile ----------

router.get(
  '/me',
  handle(async (req) => {
    const profile = await clientService.getProfile(req.user.id);
    return { profile };
  })
);

router.patch(
  '/me',
  handle(async (req) => {
    const profile = await clientService.updateProfile(req.user.id, req.body || {});
    return { profile };
  })
);

// ---------- Catalogue ----------

router.get(
  '/equipment',
  handle(async () => {
    const equipment = await clientService.listEquipment();
    return { equipment };
  })
);

router.get(
  '/services',
  handle(async () => {
    const services = await clientService.listServices();
    return { services };
  })
);

// ---------- Quotes ----------

router.get(
  '/quotes',
  handle(async (req) => {
    const quotes = await clientService.listQuotes(req.user.id);
    return { quotes };
  })
);

router.get(
  '/quotes/:id',
  handle(async (req) => {
    const quote = await clientService.getQuote(req.user.id, req.params.id);
    return { quote };
  })
);

router.post(
  '/quotes',
  handle(async (req) => {
    const quote = await clientService.createQuote(req.user.id, req.body || {});
    return { quote };
  })
);

// ---------- Bookings ----------

router.get(
  '/bookings',
  handle(async (req) => {
    const bookings = await clientService.listBookings(req.user.id);
    return { bookings };
  })
);

router.get(
  '/bookings/:id',
  handle(async (req) => {
    const booking = await clientService.getBooking(req.user.id, req.params.id);
    return { booking };
  })
);

router.post(
  '/bookings',
  handle(async (req) => {
    const booking = await clientService.createBooking(req.user.id, req.body || {});
    return { booking };
  })
);

router.post(
  '/bookings/:id/cancel',
  handle(async (req) => {
    const booking = await clientService.cancelBooking(req.user.id, req.params.id);
    return { booking };
  })
);

module.exports = router;