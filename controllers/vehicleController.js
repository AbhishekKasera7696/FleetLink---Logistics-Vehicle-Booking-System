const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

// POST /api/vehicles - for adding a new vehicle
exports.addVehicle = async (req, res) => {
  try {
    const { name, capacityKg, tyres } = req.body;

    if (!name || !capacityKg || !tyres) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (typeof capacityKg !== 'number' || typeof tyres !== 'number') {
      return res.status(400).json({ error: 'Capacity and tyres must be numbers' });
    }

    const vehicle = new Vehicle({ name, capacityKg, tyres });
    await vehicle.save();
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/  for finding available vehicles
exports.getAvailableVehicles = async (req, res) => {
  try {
    const { capacityRequired, fromPincode, toPincode, startTime } = req.query;

    if (!capacityRequired || !fromPincode || !toPincode || !startTime) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    const capacity = parseFloat(capacityRequired);
    if (isNaN(capacity)) {
      return res.status(400).json({ error: 'capacityRequired must be a number' });
    }

    const start = new Date(startTime);
    if (isNaN(start.getTime())) {
      return res.status(400).json({ error: 'startTime must be a valid ISO date string' });
    }

    // Calculate estimated ride duration and end time
    const estimatedRideDurationHours = Math.abs(parseInt(toPincode) - parseInt(fromPincode)) % 24;
    const endTime = new Date(start.getTime() + estimatedRideDurationHours * 60 * 60 * 1000);

    // Find vehicles with sufficient capacity
    const vehicles = await Vehicle.find({ capacityKg: { $gte: capacity } });

    // Check for overlapping bookings for each vehicle
    const availableVehicles = [];
    for (const vehicle of vehicles) {
      const overlappingBooking = await Booking.findOne({
        vehicleId: vehicle._id,
        $or: [
          { startTime: { $lt: endTime }, endTime: { $gt: start } }
        ]
      });

      if (!overlappingBooking) {
        availableVehicles.push({
          ...vehicle.toObject(),
          estimatedRideDurationHours
        });
      }
    }

    res.json(availableVehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};