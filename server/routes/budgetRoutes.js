const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getBudgetSummary, toggleSharing, getPublicTrip } = require('../controllers/budgetController');

const router = express.Router({ mergeParams: true });

// ── Public route — NO protect middleware ───────────────────────
// GET /api/trips/public/:tripId
// Must be mounted BEFORE the protected routes in index.js to prevent
// Express matching 'public' as a :tripId param on the trips router.
// This is handled by mounting this router at /api/trips in index.js.
router.get('/public/:tripId', getPublicTrip);

// ── Protected routes ───────────────────────────────────────────
// GET   /api/trips/:tripId/budget  — budget vs. spend summary
router.get('/:tripId/budget', protect, getBudgetSummary);

// PATCH /api/trips/:tripId/share   — toggle public/private
router.patch('/:tripId/share', protect, toggleSharing);

module.exports = router;
