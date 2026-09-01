const Joi  = require('joi');
const pool = require('../config/db');

// ── Joi Validation Schema ──────────────────────────────────────
const tripSchema = Joi.object({
  title:          Joi.string().min(2).max(200).required(),
  description:    Joi.string().max(1000).optional().allow('', null),
  start_date:     Joi.date().iso().optional().allow(null),
  end_date:       Joi.date().iso().min(Joi.ref('start_date')).optional().allow(null)
                     .messages({ 'date.min': 'end_date must not be before start_date.' }),
  total_budget:   Joi.number().positive().precision(2).optional().default(0),
  currency:       Joi.string().length(3).uppercase().optional().default('USD'),
  sharing_status: Joi.string().valid('private', 'shared', 'public').optional().default('private'),
  cover_image_url:Joi.string().uri().optional().allow('', null),
});

// ──────────────────────────────────────────────────────────────
// POST /api/trips
// Create a new trip for the logged-in user
// ──────────────────────────────────────────────────────────────
const createTrip = async (req, res) => {
  const { error, value } = tripSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    title, description, start_date, end_date,
    total_budget, currency, sharing_status, cover_image_url,
  } = value;

  const user_id = req.user.id;

  try {
    const [result] = await pool.execute(
      `INSERT INTO trips
         (user_id, title, description, start_date, end_date,
          total_budget, currency, sharing_status, cover_image_url)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        user_id, title, description ?? null,
        start_date ?? null, end_date ?? null,
        total_budget, currency, sharing_status, cover_image_url ?? null,
      ]
    );

    const tripId = result.insertId;

    // Fetch the newly created row so we return complete data
    const [rows] = await pool.execute(
      'SELECT * FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );

    res.status(201).json({
      status:  'success',
      tripId,                  // ← frontend uses this to navigate to Itinerary Builder
      data:    { trip: rows[0] },
    });
  } catch (err) {
    console.error('[createTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to create trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips
// Fetch all trips owned by the logged-in user
// ──────────────────────────────────────────────────────────────
const getAllTrips = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT * FROM trips
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user.id]
    );

    res.json({
      status:  'success',
      results: rows.length,
      data:    { trips: rows },
    });
  } catch (err) {
    console.error('[getAllTrips]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch trips.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:id
// Fetch a single trip — enforces ownership check
// ──────────────────────────────────────────────────────────────
const getTripById = async (req, res) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT * FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );

    if (!rows.length) {
      return res.status(404).json({ status: 'fail', message: 'Trip not found.' });
    }

    const trip = rows[0];

    // Ownership guard
    if (trip.user_id !== req.user.id) {
      return res.status(403).json({
        status:  'fail',
        message: 'You do not have permission to view this trip.',
      });
    }

    res.json({ status: 'success', data: { trip } });
  } catch (err) {
    console.error('[getTripById]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/trips/:id
// Update a trip — enforces ownership check
// ──────────────────────────────────────────────────────────────
const updateTrip = async (req, res) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const { error, value } = tripSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  try {
    // Ownership check first
    const [existing] = await pool.execute(
      'SELECT user_id FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );
    if (!existing.length) {
      return res.status(404).json({ status: 'fail', message: 'Trip not found.' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({
        status:  'fail',
        message: 'You do not have permission to update this trip.',
      });
    }

    const {
      title, description, start_date, end_date,
      total_budget, currency, sharing_status, cover_image_url,
    } = value;

    await pool.execute(
      `UPDATE trips
       SET title = ?, description = ?, start_date = ?, end_date = ?,
           total_budget = ?, currency = ?, sharing_status = ?, cover_image_url = ?
       WHERE id = ?`,
      [
        title, description ?? null,
        start_date ?? null, end_date ?? null,
        total_budget, currency, sharing_status,
        cover_image_url ?? null, tripId,
      ]
    );

    const [updated] = await pool.execute(
      'SELECT * FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );

    res.json({ status: 'success', data: { trip: updated[0] } });
  } catch (err) {
    console.error('[updateTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update trip.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/trips/:id
// Delete a trip — ON DELETE CASCADE handles stops/activities
// ──────────────────────────────────────────────────────────────
const deleteTrip = async (req, res) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  try {
    // Ownership check
    const [existing] = await pool.execute(
      'SELECT user_id FROM trips WHERE id = ? LIMIT 1',
      [tripId]
    );
    if (!existing.length) {
      return res.status(404).json({ status: 'fail', message: 'Trip not found.' });
    }
    if (existing[0].user_id !== req.user.id) {
      return res.status(403).json({
        status:  'fail',
        message: 'You do not have permission to delete this trip.',
      });
    }

    await pool.execute('DELETE FROM trips WHERE id = ?', [tripId]);

    // 204 No Content — cascade takes care of stops, activities, checklist
    res.status(204).send();
  } catch (err) {
    console.error('[deleteTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete trip.' });
  }
};

module.exports = { createTrip, getAllTrips, getTripById, updateTrip, deleteTrip };
