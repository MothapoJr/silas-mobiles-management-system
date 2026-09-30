'use strict';

const { getModels } = require('../models');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const AVAILABILITY = ['available', 'unavailable', 'on_leave'];
const ASSIGNMENT_STATUSES = ['assigned', 'completed', 'cancelled'];

// ---------- Profile ----------

async function getProfile(staffId) {
  const { Staff, User } = getModels();
  const staff = await Staff.findByPk(staffId, {
    include: [{ model: User, attributes: ['id', 'username', 'email', 'roleType', 'isActive'] }],
  });
  if (!staff) throw httpError(404, 'Staff profile not found');
  return staff;
}

async function updateProfile(staffId, { jobRole, vehicleLicense }) {
  const { Staff } = getModels();
  const staff = await Staff.findByPk(staffId);
  if (!staff) throw httpError(404, 'Staff profile not found');

  await staff.update({
    jobRole: jobRole !== undefined ? jobRole : staff.jobRole,
    vehicleLicense: vehicleLicense !== undefined ? vehicleLicense : staff.vehicleLicense,
  });

  return getProfile(staffId);
}

/**
 * Staff.updateAvailability(status)
 */
async function updateAvailability(staffId, availability) {
  if (!AVAILABILITY.includes(availability)) {
    throw httpError(400, `Invalid availability: ${availability}. Allowed: ${AVAILABILITY.join(', ')}`);
  }

  const { Staff } = getModels();
  const staff = await Staff.findByPk(staffId);
  if (!staff) throw httpError(404, 'Staff profile not found');

  await staff.update({ availability });
  return getProfile(staffId);
}

// ---------- Assignments (viewAssignedBookings) ----------

async function listAssignments(staffId, { status } = {}) {
  const { StaffAssignment, Booking, Event, BookingItem, Equipment } = getModels();
  const where = { staffId };
  if (status) {
    if (!ASSIGNMENT_STATUSES.includes(status)) {
      throw httpError(400, `Invalid assignment status filter: ${status}`);
    }
    where.status = status;
  }

  return StaffAssignment.findAll({
    where,
    include: [
      {
        model: Booking,
        include: [
          { model: Event },
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

async function getAssignment(staffId, assignmentId) {
  const { StaffAssignment, Booking, Event, BookingItem, Equipment } = getModels();
  const assignment = await StaffAssignment.findOne({
    where: { id: assignmentId, staffId },
    include: [
      {
        model: Booking,
        include: [
          { model: Event },
          {
            model: BookingItem,
            include: [{ model: Equipment, attributes: ['id', 'name', 'status', 'dailyRate'] }],
          },
        ],
      },
    ],
  });
  if (!assignment) throw httpError(404, 'Assignment not found');
  return assignment;
}

/**
 * Update assignment status (delivery/collection progress).
 * Allowed: assigned → completed | cancelled
 */
async function updateAssignmentStatus(staffId, assignmentId, status) {
  if (!ASSIGNMENT_STATUSES.includes(status)) {
    throw httpError(400, `Invalid assignment status: ${status}`);
  }

  const assignment = await getAssignment(staffId, assignmentId);
  const current = assignment.status;

  const allowed = {
    assigned: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  if (!allowed[current]?.includes(status)) {
    throw httpError(400, `Cannot change assignment status from "${current}" to "${status}"`);
  }

  await assignment.update({ status });
  return getAssignment(staffId, assignmentId);
}

// ---------- Issue reporting (equipment → maintenance) ----------

/**
 * Staff reports an equipment issue on a booking they are assigned to.
 * Sets Equipment.status → maintenance (Equipment Status Lifecycle).
 * body: { notes? } — notes accepted for future notification/audit (T15)
 */
async function reportEquipmentIssue(staffId, equipmentId, { notes } = {}) {
  const { Equipment, StaffAssignment, BookingItem, sequelize } = getModels();

  return sequelize.transaction(async (t) => {
    // Staff may only report issues on equipment linked to one of their active assignments
    const assignment = await StaffAssignment.findOne({
      where: { staffId, status: 'assigned' },
      include: [
        {
          model: require('../models').getModels().Booking,
          include: [
            {
              model: BookingItem,
              where: { equipmentId },
              required: true,
            },
          ],
        },
      ],
      transaction: t,
    });

    // Simpler ownership check: equipment appears on any of this staff's assigned bookings
    const linked = await StaffAssignment.findOne({
      where: { staffId },
      include: [
        {
          model: require('../models').getModels().Booking,
          required: true,
          include: [
            {
              model: BookingItem,
              where: { equipmentId },
              required: true,
            },
          ],
        },
      ],
      transaction: t,
    });

    // Prefer explicit check without nested require
    void assignment;

    const { Booking } = getModels();
    const hasLink = await StaffAssignment.findOne({
      where: { staffId },
      include: [
        {
          model: Booking,
          required: true,
          include: [
            {
              model: BookingItem,
              where: { equipmentId },
              required: true,
            },
          ],
        },
      ],
      transaction: t,
    });

    if (!hasLink) {
      throw httpError(403, 'You can only report issues on equipment linked to your assignments');
    }

    const equipment = await Equipment.findByPk(equipmentId, { transaction: t });
    if (!equipment) throw httpError(404, 'Equipment not found');

    if (equipment.status === 'retired') {
      throw httpError(400, 'Cannot report an issue on retired equipment');
    }

    void notes; // reserved for T15 notification / audit log

    await equipment.update({ status: 'maintenance' }, { transaction: t });
    return equipment;
  });
}

module.exports = {
  getProfile,
  updateProfile,
  updateAvailability,
  listAssignments,
  getAssignment,
  updateAssignmentStatus,
  reportEquipmentIssue,
};