const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getNotes, createNote, updateNote, deleteNote,
} = require('../controllers/notesController');

const router = express.Router({ mergeParams: true }); // inherit tripId

router.use(protect);

// GET  /api/trips/:tripId/notes         — list all notes
// POST /api/trips/:tripId/notes         — create note
router.route('/')
  .get(getNotes)
  .post(createNote);

// PUT    /api/trips/:tripId/notes/:noteId  — update
// DELETE /api/trips/:tripId/notes/:noteId  — delete
router.route('/:noteId')
  .put(updateNote)
  .delete(deleteNote);

module.exports = router;
