const mongoose = require('mongoose');

const VehicleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  capacityKg: {
    type: Number,
    required: true
  },
  tyres: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Vehicle', VehicleSchema);