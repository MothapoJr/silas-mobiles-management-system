'use strict';

// One booking taken all the way through the model — event, line items,
// an invoice, a staff assignment — plus one separate quote that hasn't
// converted yet. Reuses the exact IDs the previous two seeders created
// (via require, not retyped) so this actually exercises every
// relationship in the schema rather than just proving each table can
// hold a row in isolation.
const { ids: catalogueIds } = require('./20260921130001-demo-catalogue');
const { ids: userIds } = require('./20260921130002-demo-users');

const { EQUIPMENT, SERVICE } = catalogueIds;
const { USER } = userIds;

const BOOKING_ID = '00000000-0000-4000-8000-000000000401';
const EVENT_ID = '00000000-0000-4000-8000-000000000402';
const BOOKING_ITEM_MARQUEE_ID = '00000000-0000-4000-8000-000000000403';
const BOOKING_ITEM_TOILET_ID = '00000000-0000-4000-8000-000000000404';
const INVOICE_ID = '00000000-0000-4000-8000-000000000405';
const STAFF_ASSIGNMENT_ID = '00000000-0000-4000-8000-000000000406';

const QUOTE_ID = '00000000-0000-4000-8000-000000000501';
const QUOTE_ITEM_CATERING_ID = '00000000-0000-4000-8000-000000000502';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const stamp = (row) => ({ ...row, created_at: now, updated_at: now });

    // A confirmed, 3-day booking (14–16 Nov inclusive): one marquee +
    // two VIP toilets, both for the full duration. line_total is the
    // number actually summed for the booking's total_cost — not derived
    // from quantity/price/dates again here, the same way the app won't
    // re-derive it either.
    const RENTAL_DAYS = 3;
    const marqueeLineTotal = 1 * 3200.0 * RENTAL_DAYS;
    const toiletLineTotal = 2 * 850.0 * RENTAL_DAYS;

    await queryInterface.bulkInsert(
      'bookings',
      [
        stamp({
          id: BOOKING_ID,
          client_id: USER.CLIENT,
          approved_by_admin_id: USER.ADMIN,
          status: 'confirmed',
          booking_date: '2026-11-14',
          total_cost: marqueeLineTotal + toiletLineTotal,
        }),
      ],
      {}
    );

    await queryInterface.bulkInsert(
      'events',
      [
        stamp({
          id: EVENT_ID,
          booking_id: BOOKING_ID,
          venue: 'Willow Creek Estate, Pretoria East',
          guest_count: 120,
          setup_time: new Date('2026-11-14T08:00:00+02:00'),
          breakdown_time: new Date('2026-11-16T18:00:00+02:00'),
        }),
      ],
      {}
    );

    await queryInterface.bulkInsert(
      'booking_items',
      [
        stamp({
          id: BOOKING_ITEM_MARQUEE_ID,
          booking_id: BOOKING_ID,
          equipment_id: EQUIPMENT.MARQUEE_6X12,
          quantity: 1,
          rental_start_date: '2026-11-14',
          rental_end_date: '2026-11-16',
          unit_price_at_booking: 3200.0,
          line_total: marqueeLineTotal,
        }),
        stamp({
          id: BOOKING_ITEM_TOILET_ID,
          booking_id: BOOKING_ID,
          equipment_id: EQUIPMENT.TOILET_VIP,
          quantity: 2,
          rental_start_date: '2026-11-14',
          rental_end_date: '2026-11-16',
          unit_price_at_booking: 850.0,
          line_total: toiletLineTotal,
        }),
      ],
      {}
    );

    await queryInterface.bulkInsert(
      'invoices',
      [
        stamp({
          id: INVOICE_ID,
          booking_id: BOOKING_ID,
          amount: marqueeLineTotal + toiletLineTotal,
          payment_method: 'EFT',
          payment_status: 'partial',
          issue_date: '2026-10-20',
          due_date: '2026-11-07',
        }),
      ],
      {}
    );

    await queryInterface.bulkInsert(
      'staff_assignments',
      [
        stamp({
          id: STAFF_ASSIGNMENT_ID,
          staff_id: USER.STAFF,
          booking_id: BOOKING_ID,
          assignment_role: 'Setup Lead',
          assigned_at: '2026-11-13',
          status: 'assigned',
        }),
      ],
      {}
    );

    // A separate, still-open quote — not every quote converts.
    await queryInterface.bulkInsert(
      'quotes',
      [
        stamp({
          id: QUOTE_ID,
          client_id: USER.CLIENT,
          converted_booking_id: null,
          quote_date: '2026-10-01',
          status: 'sent',
          total_estimate: 385.0 * 80,
        }),
      ],
      {}
    );

    await queryInterface.bulkInsert(
      'quote_items',
      [
        stamp({
          id: QUOTE_ITEM_CATERING_ID,
          quote_id: QUOTE_ID,
          service_id: SERVICE.FULL_CATERING,
          quantity: 80,
          unit_price: 385.0,
        }),
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('quote_items', null, {});
    await queryInterface.bulkDelete('quotes', null, {});
    await queryInterface.bulkDelete('staff_assignments', null, {});
    await queryInterface.bulkDelete('invoices', null, {});
    await queryInterface.bulkDelete('booking_items', null, {});
    await queryInterface.bulkDelete('events', null, {});
    await queryInterface.bulkDelete('bookings', null, {});
  },
};
