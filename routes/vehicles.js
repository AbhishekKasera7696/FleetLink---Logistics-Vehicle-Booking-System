const express = require('express');
const { addVehicle, getAvailableVehicles } = require('../controllers/vehicleController');

const router = express.Router();

router.post('/', addVehicle);
router.get('/available', getAvailableVehicles);

module.exports = router;