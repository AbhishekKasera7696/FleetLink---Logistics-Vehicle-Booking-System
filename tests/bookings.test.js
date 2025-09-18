const request = require('supertest');
const app = require('../server');
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

jest.mock('../models/Booking');
jest.mock('../models/Vehicle');

describe('Booking API', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const mockVehicle = {
        _id: '1',
        name: 'Truck',
        capacityKg: 1000,
        tyres: 6
      };
      const mockBooking = {
        _id: '1',
        vehicleId: '1',
        fromPincode: '10001',
        toPincode: '10002',
        startTime: '2023-10-27T10:00:00Z',
        endTime: '2023-10-27T11:00:00Z',
        customerId: 'customer1'
      };
      
      Vehicle.findById.mockResolvedValue(mockVehicle);
      Booking.findOne.mockResolvedValue(null);
      Booking.prototype.save = jest.fn().mockResolvedValue(mockBooking);

      const response = await request(app)
        .post('/api/bookings')
        .send({
          vehicleId: '1',
          fromPincode: '10001',
          toPincode: '10002',
          startTime: '2023-10-27T10:00:00Z',
          customerId: 'customer1'
        });

      expect(response.status).toBe(201);
      expect(response.body).toEqual(mockBooking);
    });

    it('should return error for overlapping booking', async () => {
      const mockVehicle = {
        _id: '1',
        name: 'Truck',
        capacityKg: 1000,
        tyres: 6
      };
      const mockBooking = {
        _id: '1',
        vehicleId: '1',
        fromPincode: '10001',
        toPincode: '10002',
        startTime: '2023-10-27T10:00:00Z',
        endTime: '2023-10-27T11:00:00Z',
        customerId: 'customer1'
      };
      
      Vehicle.findById.mockResolvedValue(mockVehicle);
      Booking.findOne.mockResolvedValue(mockBooking);

      const response = await request(app)
        .post('/api/bookings')
        .send({
          vehicleId: '1',
          fromPincode: '10001',
          toPincode: '10002',
          startTime: '2023-10-27T10:30:00Z',
          customerId: 'customer1'
        });

      expect(response.status).toBe(409);
      expect(response.body.error).toBe('Vehicle is already booked for the given time slot');
    });
  });
});