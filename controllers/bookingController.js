const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// POST /api/bookings - for booking a vehicle
exports.bookVehicle = async (req, res) => {
  try {
    const { vehicleId, fromPincode, toPincode, startTime, customerId } = req.body;

    if (!vehicleId || !fromPincode || !toPincode || !startTime || !customerId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: 'startTime must be a valid ISO date string' });
    }

    // Check if vehicle exists
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Calculate ride duration and end time
    const estimatedRideDurationHours = Math.abs(parseInt(toPincode) - parseInt(fromPincode)) % 24;
    const endTime = new Date(start.getTime() + estimatedRideDurationHours * 60 * 60 * 1000);

    // Check for overlapping bookings for this vehicle
    const overlappingBooking = await Booking.findOne({
      vehicleId,
      $or: [
        { startTime: { $lt: endTime }, endTime: { $gt: start } }
      ]
    });

    if (overlappingBooking) {
      return res.status(409).json({ error: 'Vehicle is already booked for the given time slot' });
    }

    const booking = new Booking({
      vehicleId,
      fromPincode,
      toPincode,
      startTime: start,
      endTime,
      customerId
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};