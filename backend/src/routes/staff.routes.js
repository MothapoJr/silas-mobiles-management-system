'use strict';

const express = require('express');
const { requireAuth } = require('../middleware/auth.middleware');
const { requireRole } = require('../middleware/rbac.middleware');
const staffService = require('../services/staff.service');

const router = express.Router();

// Every staff route requires a valid access token + staff role
router.use(requireAuth, requireRole('staff'));

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
    const profile = await staffService.getProfile(req.user.id);
    return { profile };
  })
);

router.patch(
  '/me',
  handle(async (req) => {
    const profile = await staffService.updateProfile(req.user.id, req.body || {});
    return { profile };
  })
);

router.patch(
  '/me/availability',
  handle(async (req) => {
    const availability = req.body?.availability;
    if (!availability) {
      const err = new Error('availability is required');
      err.status = 400;
      throw err;
    }
    const profile = await staffService.updateAvailability(req.user.id, availability);
    return { profile };
  })
);

// ---------- Assignments ----------

router.get(
  '/assignments',
  handle(async (req) => {
    const assignments = await staffService.listAssignments(req.user.id, {
      status: req.query.status || undefined,
    });
    return { assignments };
  })
);

router.get(
  '/assignments/:id',
  handle(async (req) => {
    const assignment = await staffService.getAssignment(req.user.id, req.params.id);
    return { assignment };
  })
);

router.patch(
  '/assignments/:id/status',
  handle(async (req) => {
    const status = req.body?.status;
    if (!status) {
      const err = new Error('status is required');
      err.status = 400;
      throw err;
    }
    const assignment = await staffService.updateAssignmentStatus(
      req.user.id,
      req.params.id,
      status
    );
    return { assignment };
  })
);

// ---------- Issue reporting ----------

router.post(
  '/equipment/:id/report-issue',
  handle(async (req) => {
    const equipment = await staffService.reportEquipmentIssue(
      req.user.id,
      req.params.id,
      { notes: req.body?.notes }
    );
    return { equipment };
  })
);

module.exports = router;