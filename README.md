# FleetLink

**FleetLink** is a lightweight logistics vehicle booking system implemented with a React frontend and an Express + MongoDB (Mongoose) backend. It lets operators add vehicles, search for available vehicles for a requested time window and capacity, and create bookings while preventing overlapping reservations.

---

## Quick elevator pitch (how to explain it to someone)

FleetLink is a simple booking platform for logistics operators. Imagine a small fleet operator who wants to list trucks, then let customers search for trucks by required capacity, origin/destination pincode and start time. The system returns only vehicles that have enough capacity and are not already booked for the requested time window. If a vehicle is free, a booking can be created with a start and calculated end time.

Technically, the app uses:

* A React UI for adding vehicles and searching/booking them.
* An Express REST API that serves vehicle and booking endpoints.
* MongoDB for persistence with two Mongoose models: `Vehicle` and `Booking`.

---

## Features

* Add vehicles (name, capacity in KG, number of tyres).
* Search available vehicles by capacity, from/to pincodes and start time.
* Basic booking flow with conflict detection (prevents overlapping bookings for the same vehicle).
* Simple duration heuristic (derived from numeric pincodes) to estimate ride duration and end time.
* Basic unit tests using Jest + Supertest (mocks Mongoose models).

---

## Project structure (high level)

```
root
├─ server.js                # Express app, route registration, MongoDB connection
├─ models/
│  ├─ Vehicle.js            # Vehicle schema
│  └─ Booking.js            # Booking schema
├─ controllers/
│  ├─ vehicleController.js  # addVehicle, getAvailableVehicles
│  └─ bookingController.js  # bookVehicle
├─ routes/
│  ├─ vehicles.js           # /api/vehicles
│  └─ bookings.js           # /api/bookings
├─ client/ (React app)
│  ├─ components/
│  │  ├─ AddVehicle.jsx
│  │  └─ SearchAndBook.jsx
│  └─ App.jsx
└─ tests/                   # Jest + Supertest tests (mocks models)
```

---

## Data models

### Vehicle

```js
{ name: String, capacityKg: Number, tyres: Number }
```

### Booking

```js
{ vehicleId: ObjectId (ref Vehicle), fromPincode: String, toPincode: String, startTime: Date, endTime: Date, customerId: String }
```

Notes:

* `endTime` is computed server-side using a simple heuristic based on numeric difference between `fromPincode` and `toPincode` (mod 24 hours). This is intentionally simple for demonstration — swap with a real distance/duration calculation in production.

---

## How it works (request flow)

1. Client adds vehicles via `POST /api/vehicles` (name, capacityKg, tyres).
2. To find vehicles, client calls `GET /api/vehicles/available?capacityRequired=...&fromPincode=...&toPincode=...&startTime=...`.

   * Server validates query params, computes `estimatedRideDurationHours`, `endTime`, queries vehicles with `capacityKg >= capacityRequired`, and filters out those with an overlapping `Booking` (where booking.start < end && booking.end > start).
3. Client picks a vehicle and requests `POST /api/bookings` with `vehicleId, fromPincode, toPincode, startTime, customerId`.

   * Server recalculates `endTime`, checks for overlapping bookings, and, if clear, stores the booking.

---

## API endpoints

### POST /api/vehicles

Add a vehicle.

**Request body** (JSON):

```json
{ "name": "Truck A", "capacityKg": 1000, "tyres": 6 }
```

**Responses**

* `201` created: returns the created vehicle object
* `400` validation error
* `500` server error

---

### GET /api/vehicles/available

Search vehicles.

**Query parameters** (all required):

* `capacityRequired` (number)
* `fromPincode` (string)
* `toPincode` (string)
* `startTime` (ISO string)

**Response**

* `200`: array of vehicle objects with an added `estimatedRideDurationHours` field
* `400`, `500` as needed

**Example**

```
GET /api/vehicles/available?capacityRequired=230&fromPincode=211011&toPincode=211001&startTime=2025-09-18T01:19:00.000Z
```

---

### POST /api/bookings

Create a booking.

**Request body** (JSON):

```json
{
  "vehicleId": "<vehicleId>",
  "fromPincode": "211011",
  "toPincode": "211001",
  "startTime": "2025-09-18T01:19:00.000Z",
  "customerId": "customer1"
}
```

**Responses**

* `201` booking created
* `409` conflict — vehicle already booked for the requested time
* `400` validation error
* `500` server error

---

## Setup & run (development)

1. Clone repo
2. Install server deps: `npm install`
3. Install client deps: `cd client && npm install` (if client in separate folder)
4. Create `.env` with:

```
MONGODB_URI=mongodb://127.0.0.1:27017/fleetlink
PORT=5000
```

5. Start MongoDB locally or use a cloud MongoDB connection string.
6. Start server: `npm run dev` or `node server.js` (adjust script name as project uses)
7. Start frontend: `cd client && npm start`
8. Open `http://localhost:3000` (or wherever client is served)

---

## Running tests

Tests use Jest + Supertest and mock Mongoose models. Run:

```
npm test
```

Because models are mocked, these tests run without a real database.

---

## Common issues & troubleshooting

* **`Booking is not defined` / ReferenceError**: You must `require('../models/Booking')` inside `controllers/vehicleController.js`. (This was a real bug during development.)

* **`MongooseError: The 'uri' parameter to 'openUri()' must be a string, got "undefined"`**: Your `MONGODB_URI` env var is missing. Add it to `.env` or use the fallback in `server.js`.

* **500 Internal Server Error on /api/vehicles/available**: Check server console logs for the stack. Add `console.error(err.stack)` in catch blocks while debugging.

* **Invalid date / parsing issues**: Ensure `startTime` query and body values are valid ISO date strings (use `new Date(...).toISOString()` on the client before sending).

* **Estimated duration is 0**: The current heuristic uses `Math.abs(parseInt(toPincode) - parseInt(fromPincode)) % 24`. If pincodes are non-numeric or equal, this may return `0` — consider using a minimum duration of 1 hour for realistic behavior.

---
