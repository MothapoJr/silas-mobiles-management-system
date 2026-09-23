'use strict';

// Equipment categories, equipment and services — seeded from Silas
// Mobiles' actual service list (Task 1 doc, Section 3.2 of the reference
// document), so the catalogue looks real rather than "Widget A, Widget B"
// from the first screen a Client sees. IDs are fixed, obviously-fake UUIDs
// (00000000-...) on purpose: easy to recognise as seed data in logs, and
// referenced directly by the demo-transactions seeder that runs after this
// one.
const CATEGORY = {
  KITCHENS: '00000000-0000-4000-8000-000000000101',
  TOILETS: '00000000-0000-4000-8000-000000000102',
  FRIDGES: '00000000-0000-4000-8000-000000000103',
  HANDWASHERS: '00000000-0000-4000-8000-000000000104',
  HEATERS: '00000000-0000-4000-8000-000000000105',
  DECOR_TENTS: '00000000-0000-4000-8000-000000000106',
  TRAILER_BARS: '00000000-0000-4000-8000-000000000107',
  WARMERS: '00000000-0000-4000-8000-000000000108',
};

const EQUIPMENT = {
  KITCHEN_STANDARD: '00000000-0000-4000-8000-000000000201',
  TOILET_VIP: '00000000-0000-4000-8000-000000000202',
  COLD_ROOM_MEDIUM: '00000000-0000-4000-8000-000000000203',
  HANDWASH_STATION: '00000000-0000-4000-8000-000000000204',
  PATIO_HEATER: '00000000-0000-4000-8000-000000000205',
  MARQUEE_6X12: '00000000-0000-4000-8000-000000000206',
  TRAILER_BAR: '00000000-0000-4000-8000-000000000207',
  CHAFING_SET: '00000000-0000-4000-8000-000000000208',
};

const SERVICE = {
  FULL_CATERING: '00000000-0000-4000-8000-000000000301',
  DECOR_STYLING: '00000000-0000-4000-8000-000000000302',
  DELIVERY_SETUP: '00000000-0000-4000-8000-000000000303',
  BAR_STAFF: '00000000-0000-4000-8000-000000000304',
};

module.exports = {
  ids: { CATEGORY, EQUIPMENT, SERVICE },

  async up(queryInterface) {
    const now = new Date();
    const stamp = (row) => ({ ...row, created_at: now, updated_at: now });

    await queryInterface.bulkInsert(
      'equipment_categories',
      [
        { id: CATEGORY.KITCHENS, category_name: 'Mobile Kitchens', description: 'Fully-equipped mobile kitchen units for on-site food preparation.' },
        { id: CATEGORY.TOILETS, category_name: 'Mobile Toilets', description: 'Portable and VIP-standard ablution units.' },
        { id: CATEGORY.FRIDGES, category_name: 'Mobile Fridges', description: 'Refrigerated units and cold rooms for perishable storage.' },
        { id: CATEGORY.HANDWASHERS, category_name: 'Mobile Handwashers', description: 'Freestanding handwashing stations.' },
        { id: CATEGORY.HEATERS, category_name: 'Gas Heaters', description: 'Outdoor patio and marquee gas heaters.' },
        { id: CATEGORY.DECOR_TENTS, category_name: 'Décor & Tents', description: 'Marquees, tents and event décor equipment.' },
        { id: CATEGORY.TRAILER_BARS, category_name: 'Trailer Bars', description: 'Mobile bar units for events.' },
        { id: CATEGORY.WARMERS, category_name: 'Food Warmers', description: 'Chafing dishes and food-warming equipment.' },
      ].map(stamp),
      {}
    );

    await queryInterface.bulkInsert(
      'equipment',
      [
        { id: EQUIPMENT.KITCHEN_STANDARD, category_id: CATEGORY.KITCHENS, name: 'Mobile Kitchen Unit — Standard', status: 'available', daily_rate: 2500.0, description: 'Gas hobs, prep counters and hand-wash point.' },
        { id: EQUIPMENT.TOILET_VIP, category_id: CATEGORY.TOILETS, name: 'VIP Portable Toilet', status: 'available', daily_rate: 850.0, description: 'Flushing VIP unit with hand basin and mirror.' },
        { id: EQUIPMENT.COLD_ROOM_MEDIUM, category_id: CATEGORY.FRIDGES, name: 'Mobile Cold Room — Medium', status: 'available', daily_rate: 1800.0, description: '6m walk-in cold room, diesel-powered.' },
        { id: EQUIPMENT.HANDWASH_STATION, category_id: CATEGORY.HANDWASHERS, name: 'Freestanding Handwash Station', status: 'available', daily_rate: 350.0, description: '4-basin unit with foot-pump dispensers.' },
        { id: EQUIPMENT.PATIO_HEATER, category_id: CATEGORY.HEATERS, name: 'Patio Gas Heater', status: 'available', daily_rate: 450.0, description: 'Free-standing mushroom-style gas heater.' },
        { id: EQUIPMENT.MARQUEE_6X12, category_id: CATEGORY.DECOR_TENTS, name: '6x12m Marquee Tent', status: 'available', daily_rate: 3200.0, description: 'Seats up to 80 guests, sidewalls included.' },
        { id: EQUIPMENT.TRAILER_BAR, category_id: CATEGORY.TRAILER_BARS, name: 'Trailer Bar Unit', status: 'available', daily_rate: 1500.0, description: 'Fully-stocked mobile bar trailer.' },
        { id: EQUIPMENT.CHAFING_SET, category_id: CATEGORY.WARMERS, name: 'Chafing Dish Food Warmer Set', status: 'available', daily_rate: 400.0, description: 'Set of 6 chafing dishes with fuel gel.' },
      ].map(stamp),
      {}
    );

    await queryInterface.bulkInsert(
      'services',
      [
        { id: SERVICE.FULL_CATERING, service_name: 'Full Event Catering Package', description: 'Three-course plated menu, per guest.', base_price: 385.0 },
        { id: SERVICE.DECOR_STYLING, service_name: 'Event Décor Styling', description: 'Table settings, centrepieces and venue styling.', base_price: 6500.0 },
        { id: SERVICE.DELIVERY_SETUP, service_name: 'Delivery & Setup Service', description: 'Delivery, on-site setup and breakdown.', base_price: 1200.0 },
        { id: SERVICE.BAR_STAFF, service_name: 'Bartending Staff Service', description: 'Qualified bar staff, per person per event.', base_price: 950.0 },
      ].map(stamp),
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('services', null, {});
    await queryInterface.bulkDelete('equipment', null, {});
    await queryInterface.bulkDelete('equipment_categories', null, {});
  },
};
