'use strict';

const { EventEmitter } = require('events');

const EVENTS = {
  BOOKING_STATUS_CHANGED: 'booking:statusChanged',
};

const bus = new EventEmitter();
bus.setMaxListeners(20);

function onBookingStatusChanged(handler) {
  bus.on(EVENTS.BOOKING_STATUS_CHANGED, handler);
  return () => bus.off(EVENTS.BOOKING_STATUS_CHANGED, handler);
}

function emitBookingStatusChanged(payload) {
  if (!payload || !payload.bookingId || !payload.newStatus) {
    console.warn('[notification.observer] emitBookingStatusChanged called with incomplete payload');
    return;
  }
  bus.emit(EVENTS.BOOKING_STATUS_CHANGED, payload);
}

module.exports = {
  EVENTS,
  onBookingStatusChanged,
  emitBookingStatusChanged,
};