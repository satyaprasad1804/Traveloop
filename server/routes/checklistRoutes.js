const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  addChecklistItem,
  getChecklist,
  toggleItem,
  deleteChecklistItem,
} = require('../controllers/checklistController');

const router = express.Router({ mergeParams: true });

// All checklist routes require a valid JWT
router.use(protect);

// POST   /api/trips/:tripId/checklist             — add item
// GET    /api/trips/:tripId/checklist             — list all items (grouped + summary)
router.route('/')
  .post(addChecklistItem)
  .get(getChecklist);

// PATCH  /api/trips/:tripId/checklist/:itemId     — toggle is_packed
// DELETE /api/trips/:tripId/checklist/:itemId     — remove item
router.route('/:itemId')
  .patch(toggleItem)
  .delete(deleteChecklistItem);

module.exports = router;
