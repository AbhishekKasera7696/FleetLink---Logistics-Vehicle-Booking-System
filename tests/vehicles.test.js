const request = require('supertest');
const app = require('../server');
const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');

jest.mock('../models/Vehicle');
jest.mock('../models/Booking');

describe('Vehicle API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/vehicles', () => {
    it('should create a new vehicle', async () => {
      const mockVehicle = {
        _id: '1',
        name: 'Truck',
        capacityKg: 1000,
        tyres: 6
      };
      Vehicle.prototype.save = jest.fn().mockResolvedValue(mockVehicle);

      const response = await request(app)
        .post('/api/vehicles')
        .send({
          name: 'Truck',
          capacityKg: 1000,
          tyres: 6
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockVehicle);
    });

    it('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/vehicles')
        .send({
          name: 'Truck'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('All fields are required');
    });
  });

  describe('GET /api/vehicles/available', () => {
    it('should return available vehicles', async () => {
      const mockVehicles = [
        { _id: '1', name: 'Truck', capacityKg: 1000, tyres: 6 }
      ];
      Vehicle.find.mockResolvedValue(mockVehicles);
      Booking.findOne.mockResolvedValue(null);

      const response = await request(app)
        .get('/api/vehicles/available')
        .query({
          capacityRequired: 500,
          fromPincode: '10001',
          toPincode: '10002',
          startTime: '2023-10-27T10:00:00Z'
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual([{ ...mockVehicles[0], estimatedRideDurationHours: 1 }]);
    });
  });
});