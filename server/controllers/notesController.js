const Joi  = require('joi');
const pool = require('../config/db');

// ── Joi Schema ─────────────────────────────────────────────────
const noteSchema = Joi.object({
  title:   Joi.string().trim().max(200).optional().allow('', null),
  content: Joi.string().trim().min(1).max(5000).required()
              .messages({ 'string.empty': 'Note content must not be empty.' }),
});

// ── Helper: verify trip ownership ─────────────────────────────
const verifyTripOwner = async (tripId, userId) => {
  const [rows] = await pool.execute(
    'SELECT id FROM trips WHERE id = ? AND user_id = ? LIMIT 1',
    [tripId, userId]
  );
  return rows.length > 0;
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/notes
// List all notes for a trip, newest first
// ──────────────────────────────────────────────────────────────
const getNotes = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM trip_notes WHERE trip_id = ? ORDER BY created_at DESC',
      [tripId]
    );
    res.json({ status: 'success', results: rows.length, data: { notes: rows } });
  } catch (err) {
    console.error('[getNotes]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch notes.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/trips/:tripId/notes
// Create a new note
// ──────────────────────────────────────────────────────────────
const createNote = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  const { error, value } = noteSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO trip_notes (trip_id, title, content) VALUES (?, ?, ?)',
      [tripId, value.title ?? null, value.content]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM trip_notes WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: { note: rows[0] } });
  } catch (err) {
    console.error('[createNote]', err);
    res.status(500).json({ status: 'error', message: 'Failed to create note.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/trips/:tripId/notes/:noteId
// Update a note
// ──────────────────────────────────────────────────────────────
const updateNote = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const noteId = parseInt(req.params.noteId, 10);
  if (isNaN(tripId) || isNaN(noteId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  const { error, value } = noteSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE trip_notes SET title = ?, content = ? WHERE id = ? AND trip_id = ?',
      [value.title ?? null, value.content, noteId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Note not found.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM trip_notes WHERE id = ? LIMIT 1',
      [noteId]
    );

    res.json({ status: 'success', data: { note: rows[0] } });
  } catch (err) {
    console.error('[updateNote]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update note.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/trips/:tripId/notes/:noteId
// Delete a note
// ──────────────────────────────────────────────────────────────
const deleteNote = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const noteId = parseInt(req.params.noteId, 10);
  if (isNaN(tripId) || isNaN(noteId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM trip_notes WHERE id = ? AND trip_id = ?',
      [noteId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Note not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deleteNote]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete note.' });
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };
