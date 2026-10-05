'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const notificationService = require('../services/notification.service');

const router = express.Router();

// Any authenticated role can read/mark their own notifications
router.use(requireAuth);

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

router.get(
  '/',
  handle(async (req) => {
    const notifications = await notificationService.listForUser(req.user.id, {
      status: req.query.status || undefined,
    });
    return { notifications };
  })
);

router.get(
  '/:id',
  handle(async (req) => {
    const notification = await notificationService.getForUser(req.user.id, req.params.id);
    return { notification };
  })
);

router.patch(
  '/:id/read',
  handle(async (req) => {
    const notification = await notificationService.markAsRead(req.user.id, req.params.id);
    return { notification };
  })
);

module.exports = router;