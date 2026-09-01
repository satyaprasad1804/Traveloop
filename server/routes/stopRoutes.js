const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  addStop,
  getStops,
  updateStopOrder,
  deleteStop,
} = require('../controllers/stopController');

// mergeParams: true — gives access to :tripId from the parent router
const router = express.Router({ mergeParams: true });

// All stop routes require a valid JWT
router.use(protect);

// POST   /api/trips/:tripId/stops            — add a stop (auto order_index)
// GET    /api/trips/:tripId/stops            — list stops sorted by order_index
router.route('/')
  .post(addStop)
  .get(getStops);

// PATCH  /api/trips/:tripId/stops/reorder   — batch reorder (drag-and-drop)
// ⚠️ Must be declared BEFORE /:stopId to avoid 'reorder' being matched as an ID
router.patch('/reorder', updateStopOrder);

// DELETE /api/trips/:tripId/stops/:stopId   — remove a stop (cascade: activities)
router.delete('/:stopId', deleteStop);

module.exports = router;
