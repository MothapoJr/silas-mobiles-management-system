'use strict';
const { Model, DataTypes } = require('sequelize');

// The central transactional entity (Section 9.1.9). calculateTotalCost(),
// updateStatus(), addBookingItem() and generateInvoice() from the Design
// Class Diagram are service-layer behaviours (T12's Client/Booking
// module) built on top of this model, not instance methods here — keeps
// the boundary between "what a booking looks like" and "what happens
// when one changes state" clean, which matters once the Observer-pattern
// notification fan-out (Section 9.1.12, Pattern 2) hangs off that
// boundary.
module.exports = (sequelize) => {
  class Booking extends Model {
    static associate(models) {
      Booking.belongsTo(models.Client, { foreignKey: 'clientId' });
      Booking.belongsTo(models.Administrator, { foreignKey: 'approvedByAdminId', as: 'approvedByAdmin' });
      Booking.hasOne(models.Event, { foreignKey: 'bookingId' });
      Booking.hasMany(models.BookingItem, { foreignKey: 'bookingId' });
      Booking.hasMany(models.Invoice, { foreignKey: 'bookingId' });
      Booking.hasMany(models.StaffAssignment, { foreignKey: 'bookingId' });
      Booking.hasMany(models.Notification, { foreignKey: 'bookingId' });
      Booking.hasMany(models.Quote, { foreignKey: 'convertedBookingId', as: 'convertedFromQuotes' });
      // Explicit alias: Sequelize's automatic pluralisation turns "Staff"
      // into "Staffs" for the generated getStaffs()/addStaffs() mixins,
      // which is exactly the kind of thing worth pinning down explicitly
      // rather than discovering by accident later.
      Booking.belongsToMany(models.Staff, {
        through: models.StaffAssignment,
        foreignKey: 'bookingId',
        otherKey: 'staffId',
        as: 'assignedStaff',
      });
    }
  }

  Booking.init(
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      clientId: { type: DataTypes.UUID, allowNull: false },
      approvedByAdminId: { type: DataTypes.UUID, allowNull: true },
      status: {
        type: DataTypes.ENUM('pending', 'confirmed', 'active', 'completed', 'cancelled', 'disputed', 'expired'),
        allowNull: false,
        defaultValue: 'pending',
      },
      bookingDate: { type: DataTypes.DATEONLY, allowNull: false },
      totalCost: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
    },
    { sequelize, modelName: 'Booking', tableName: 'bookings' }
  );

  return Booking;
};
