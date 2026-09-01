const Joi  = require('joi');
const pool = require('../config/db');

// ── Joi Schema ─────────────────────────────────────────────────
const activitySchema = Joi.object({
  title:         Joi.string().trim().min(1).max(200).required(),
  description:   Joi.string().max(1000).optional().allow('', null),
  category:      Joi.string()
                   .valid('sightseeing','food','transport','accommodation','adventure','shopping','other')
                   .optional()
                   .default('other'),
  cost:          Joi.number().min(0).precision(2).optional().default(0)
                   .messages({ 'number.min': 'cost must be a positive decimal or zero.' }),
  start_time:    Joi.date().iso().optional().allow(null),
  end_time:      Joi.date().iso().min(Joi.ref('start_time')).optional().allow(null)
                   .messages({ 'date.min': 'end_time must not be before start_time.' }),
  location_name: Joi.string().max(200).optional().allow('', null),
  booking_ref:   Joi.string().max(100).optional().allow('', null),
  is_booked:     Joi.boolean().optional().default(false),
});

// ── Helper: verify stop belongs to a trip owned by the user ───
const verifyStopOwner = async (stopId, userId) => {
  const [rows] = await pool.execute(
    `SELECT s.id FROM stops s
     INNER JOIN trips t ON t.id = s.trip_id
     WHERE s.id = ? AND t.user_id = ?
     LIMIT 1`,
    [stopId, userId]
  );
  return rows.length > 0;
};

// ──────────────────────────────────────────────────────────────
// POST /api/stops/:stopId/activities
// Add an activity to a city stop
// ──────────────────────────────────────────────────────────────
const addActivity = async (req, res) => {
  const stopId = parseInt(req.params.stopId, 10);
  if (isNaN(stopId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid stop ID.' });
  }

  // Ownership check — walks stop → trip → user
  const owns = await verifyStopOwner(stopId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Stop not found or you do not have permission.',
    });
  }

  const { error, value } = activitySchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    title, description, category, cost,
    start_time, end_time, location_name, booking_ref, is_booked,
  } = value;

  try {
    const [result] = await pool.execute(
      `INSERT INTO activities
         (stop_id, title, description, category, cost,
          start_time, end_time, location_name, booking_ref, is_booked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        stopId, title, description ?? null, category, cost,
        start_time ?? null, end_time ?? null,
        location_name ?? null, booking_ref ?? null,
        is_booked ? 1 : 0,
      ]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM activities WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: { activity: rows[0] } });
  } catch (err) {
    console.error('[addActivity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to add activity.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/stops/:stopId/activities
// List all activities for a stop, ordered by start_time
// ──────────────────────────────────────────────────────────────
const getActivities = async (req, res) => {
  const stopId = parseInt(req.params.stopId, 10);
  if (isNaN(stopId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid stop ID.' });
  }

  const owns = await verifyStopOwner(stopId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Stop not found or you do not have permission.',
    });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT * FROM activities
       WHERE stop_id = ?
       ORDER BY start_time ASC, id ASC`,
      [stopId]
    );

    res.json({
      status:  'success',
      results: rows.length,
      data:    { activities: rows },
    });
  } catch (err) {
    console.error('[getActivities]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch activities.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/stops/:stopId/activities/:activityId
// Update an activity
// ──────────────────────────────────────────────────────────────
const updateActivity = async (req, res) => {
  const stopId     = parseInt(req.params.stopId, 10);
  const activityId = parseInt(req.params.activityId, 10);
  if (isNaN(stopId) || isNaN(activityId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const owns = await verifyStopOwner(stopId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Stop not found or you do not have permission.',
    });
  }

  const { error, value } = activitySchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const {
    title, description, category, cost,
    start_time, end_time, location_name, booking_ref, is_booked,
  } = value;

  try {
    const [result] = await pool.execute(
      `UPDATE activities
       SET title = ?, description = ?, category = ?, cost = ?,
           start_time = ?, end_time = ?, location_name = ?,
           booking_ref = ?, is_booked = ?
       WHERE id = ? AND stop_id = ?`,
      [
        title, description ?? null, category, cost,
        start_time ?? null, end_time ?? null,
        location_name ?? null, booking_ref ?? null,
        is_booked ? 1 : 0,
        activityId, stopId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Activity not found.' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM activities WHERE id = ? LIMIT 1',
      [activityId]
    );

    res.json({ status: 'success', data: { activity: rows[0] } });
  } catch (err) {
    console.error('[updateActivity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update activity.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/stops/:stopId/activities/:activityId
// Remove a single activity
// ──────────────────────────────────────────────────────────────
const deleteActivity = async (req, res) => {
  const stopId     = parseInt(req.params.stopId, 10);
  const activityId = parseInt(req.params.activityId, 10);
  if (isNaN(stopId) || isNaN(activityId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid ID.' });
  }

  const owns = await verifyStopOwner(stopId, req.user.id);
  if (!owns) {
    return res.status(403).json({
      status:  'fail',
      message: 'Stop not found or you do not have permission.',
    });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM activities WHERE id = ? AND stop_id = ?',
      [activityId, stopId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Activity not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deleteActivity]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete activity.' });
  }
};

module.exports = { addActivity, getActivities, updateActivity, deleteActivity };
