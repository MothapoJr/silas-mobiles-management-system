'use strict';

const { getModels } = require('../models');
const { onBookingStatusChanged } = require('./notification.observer');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

const NOTIFICATION_STATUSES = ['pending', 'sent', 'failed', 'read'];

/**
 * Human-readable message for a booking status transition (SA English).
 */
function messageForStatusChange({ previousStatus, newStatus, bookingId }) {
  const shortId = String(bookingId).slice(0, 8);
  switch (newStatus) {
    case 'confirmed':
      return `Your booking ${shortId}… has been confirmed.`;
    case 'cancelled':
      if (previousStatus === 'pending') {
        return `Your booking ${shortId}… was not approved and has been cancelled.`;
      }
      return `Your booking ${shortId}… has been cancelled.`;
    case 'active':
      return `Your booking ${shortId}… is now active.`;
    case 'completed':
      return `Your booking ${shortId}… has been completed. Thank you for choosing Silas Mobiles.`;
    case 'disputed':
      return `Your booking ${shortId}… has been marked as disputed. Our team will contact you.`;
    case 'expired':
      return `Your booking ${shortId}… has expired without confirmation.`;
    default:
      return `Your booking ${shortId}… status is now "${newStatus}".`;
  }
}

/**
 * Stub SES send — marks the row sent/failed and logs.
 * Swap this for AWS SES (af-south-1) when credentials are available;
 * keep the same signature so callers do not change.
 */
async function sendViaSesStub(notification) {
  const { Notification } = getModels();
  try {
    // Local / CI: no real SES. Log for visibility during demos.
    console.info(
      `[notification.ses-stub] would email user=${notification.userId} type=${notification.type} msg="${notification.message.slice(0, 80)}…"`
    );
    await notification.update({ status: 'sent' });
    return notification;
  } catch (err) {
    console.error('[notification.ses-stub] failed', err.message);
    await Notification.update({ status: 'failed' }, { where: { id: notification.id } });
    return notification;
  }
}

async function createNotification({ userId, bookingId, message, type }) {
  const { Notification } = getModels();
  if (!userId) throw httpError(400, 'userId is required');
  if (!message || !String(message).trim()) throw httpError(400, 'message is required');

  const notification = await Notification.create({
    userId,
    bookingId: bookingId || null,
    message: String(message).trim(),
    type: type || null,
    status: 'pending',
  });

  // Fire-and-forget delivery attempt (stub SES)
  sendViaSesStub(notification).catch((err) => {
    console.error('[notification.service] send failed', err.message);
  });

  return notification;
}

async function listForUser(userId, { status } = {}) {
  const { Notification } = getModels();
  const where = { userId };
  if (status) {
    if (!NOTIFICATION_STATUSES.includes(status)) {
      throw httpError(400, `Invalid notification status filter: ${status}`);
    }
    where.status = status;
  }

  return Notification.findAll({
    where,
    order: [['createdAt', 'DESC']],
  });
}

async function getForUser(userId, notificationId) {
  const { Notification } = getModels();
  const notification = await Notification.findOne({
    where: { id: notificationId, userId },
  });
  if (!notification) throw httpError(404, 'Notification not found');
  return notification;
}

async function markAsRead(userId, notificationId) {
  const notification = await getForUser(userId, notificationId);
  if (notification.status === 'read') return notification;
  await notification.update({ status: 'read' });
  return getForUser(userId, notificationId);
}

/**
 * Observer handler: booking status change → in-app notification for the client.
 * Registered once at boot via registerObservers().
 */
async function handleBookingStatusChanged(payload) {
  const { bookingId, clientId, previousStatus, newStatus } = payload;
  if (!clientId) {
    console.warn('[notification.service] status change missing clientId, skipping');
    return;
  }

  try {
    await createNotification({
      userId: clientId,
      bookingId,
      type: `booking.${newStatus}`,
      message: messageForStatusChange({ previousStatus, newStatus, bookingId }),
    });
  } catch (err) {
    // Never let notification failures break the booking transaction path
    console.error('[notification.service] handleBookingStatusChanged failed', err.message);
  }
}

/**
 * Call once at application boot (index.js) so the Observer is live.
 */
function registerObservers() {
  onBookingStatusChanged(handleBookingStatusChanged);
  console.info('[notification.service] observers registered');
}

module.exports = {
  createNotification,
  listForUser,
  getForUser,
  markAsRead,
  registerObservers,
  // exported for tests / manual triggers
  handleBookingStatusChanged,
  sendViaSesStub,
};