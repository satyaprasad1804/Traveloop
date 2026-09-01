const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createTrip,
  getAllTrips,
  getTripById,
  updateTrip,
  deleteTrip,
} = require('../controllers/tripController');

const router = express.Router();

// All trip routes require a valid JWT
router.use(protect);

// POST   /api/trips        — create a new trip
// GET    /api/trips        — list all trips for logged-in user
router.route('/')
  .post(createTrip)
  .get(getAllTrips);

// GET    /api/trips/:id    — get single trip (ownership enforced)
// PUT    /api/trips/:id    — update trip    (ownership enforced)
// DELETE /api/trips/:id    — delete trip    (cascade: stops → activities → checklist)
router.route('/:id')
  .get(getTripById)
  .put(updateTrip)
  .delete(deleteTrip);

module.exports = router;
