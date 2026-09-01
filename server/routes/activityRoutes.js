const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  addActivity,
  getActivities,
  updateActivity,
  deleteActivity,
} = require('../controllers/activityController');

// mergeParams: true — gives access to :stopId from the parent router
const router = express.Router({ mergeParams: true });

// All activity routes require a valid JWT
router.use(protect);

// POST   /api/stops/:stopId/activities              — add activity to a stop
// GET    /api/stops/:stopId/activities              — list activities for a stop
router.route('/')
  .post(addActivity)
  .get(getActivities);

// PUT    /api/stops/:stopId/activities/:activityId  — update an activity
// DELETE /api/stops/:stopId/activities/:activityId  — remove an activity
router.route('/:activityId')
  .put(updateActivity)
  .delete(deleteActivity);

module.exports = router;
