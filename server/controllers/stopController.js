const Joi  = require('joi');
const pool = require('../config/db');

// ── Joi Schemas ────────────────────────────────────────────────
const stopSchema = Joi.object({
  city_name:      Joi.string().trim().min(1).max(150).required()
                     .messages({ 'string.empty': 'city_name must not be empty.' }),
  country_code:   Joi.string().length(2).uppercase().optional().allow('', null),
  latitude:       Joi.number().min(-90).max(90).optional().allow(null),
  longitude:      Joi.number().min(-180).max(180).optional().allow(null),
  arrival_date:   Joi.date().iso().optional().allow(null),
  departure_date: Joi.date().iso().min(Joi.ref('arrival_date')).optional().allow(null)
                     .messages({ 'date.min': 'departure_date must not be before arrival_date.' }),
  notes:          Joi.string().max(1000).optional().allow('', null),
});

const reorderSchema = Joi.object({
  // Array of { id, order_index } pairs
  stops: Joi.array()
    .items(
      Joi.object({
        id:          Joi.number().integer().positive().required(),
        order_index: Joi.number().integer().min(0).required(),
      })
    )
    .min(1)
    .required(),
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
// POST /api/trips/:tripId/stops
// Add a new city stop — order_index auto-calculated
// ──────────────────────────────────────────────────────────────
const addStop = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  // Ownership check
  const owns = await verifyTripOwner(tripId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  const { error, value } = stopSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    city_name, country_code, latitude, longitude,
    arrival_date, departure_date, notes,
  } = value;

  try {
    // Auto-calculate next order_index
    const [[{ count }]] = await pool.execute(
      'SELECT COUNT(*) AS count FROM stops WHERE trip_id = ?',
      [tripId]
    );
    const order_index = parseInt(count, 10); // 0-based; first stop = 0

    const [result] = await pool.execute(
      `INSERT INTO stops
         (trip_id, city_name, country_code, latitude, longitude,
          arrival_date, departure_date, order_index, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        tripId, city_name, country_code ?? null,
        latitude ?? null, longitude ?? null,
        arrival_date ?? null, departure_date ?? null,
        order_index, notes ?? null,
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM stops WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: { stop: rows[0] } });
  } catch (err) {
    console.error('[addStop]', err);
    res.status(500).json({ status: 'error', message: 'Failed to add stop.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/stops
// Fetch all stops for a trip, sorted by order_index
// ──────────────────────────────────────────────────────────────
const getStops = async (req, res) => {
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
      'SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC',
      [tripId]
    );

    res.json({
      status:  'success',
      results: rows.length,
      data:    { stops: rows },
    });
  } catch (err) {
    console.error('[getStops]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch stops.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/trips/:tripId/stops/reorder
// Batch-update order_index for drag-and-drop reordering
// Body: { stops: [{ id, order_index }, ...] }
// ──────────────────────────────────────────────────────────────
const updateStopOrder = async (req, res) => {
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

  const { error, value } = reorderSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Update each stop's order_index in a single transaction
    for (const { id, order_index } of value.stops) {
      await conn.execute(
        'UPDATE stops SET order_index = ? WHERE id = ? AND trip_id = ?',
        [order_index, id, tripId]
      );
    }

    await conn.commit();

    // Return the freshly ordered list
    const [rows] = await conn.execute(
      'SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC',
      [tripId]
    );

    res.json({ status: 'success', data: { stops: rows } });
  } catch (err) {
    await conn.rollback();
    console.error('[updateStopOrder]', err);
    res.status(500).json({ status: 'error', message: 'Failed to reorder stops.' });
  } finally {
    conn.release();
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/trips/:tripId/stops/:stopId
// Remove a stop (cascade deletes its activities)
// ──────────────────────────────────────────────────────────────
const deleteStop = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const stopId = parseInt(req.params.stopId, 10);

  if (isNaN(tripId) || isNaN(stopId)) {
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
      'DELETE FROM stops WHERE id = ? AND trip_id = ?',
      [stopId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Stop not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deleteStop]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete stop.' });
  }
};

module.exports = { addStop, getStops, updateStopOrder, deleteStop };
