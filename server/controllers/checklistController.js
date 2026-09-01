const Joi  = require('joi');
const pool = require('../config/db');

// ── Joi Schema ─────────────────────────────────────────────────
const itemSchema = Joi.object({
  item_name: Joi.string().trim().min(1).max(150).required()
               .messages({ 'string.empty': 'item_name must not be empty.' }),
  category:  Joi.string().trim().max(80).optional().default('General'),
  quantity:  Joi.number().integer().min(1).optional().default(1),
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
// POST /api/trips/:tripId/checklist
// Add a new item to the packing list
// ──────────────────────────────────────────────────────────────
const addChecklistItem = async (req, res) => {
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

  const { error, value } = itemSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const { item_name, category, quantity } = value;

  try {
    const [result] = await pool.execute(
      'INSERT INTO packing_checklist (trip_id, item_name, category, quantity) VALUES (?, ?, ?, ?)',
      [tripId, item_name, category, quantity]
    );

    const [rows] = await pool.execute(
      'SELECT * FROM packing_checklist WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    res.status(201).json({ status: 'success', data: { item: rows[0] } });
  } catch (err) {
    console.error('[addChecklistItem]', err);
    res.status(500).json({ status: 'error', message: 'Failed to add checklist item.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/checklist
// Fetch all items, grouped by category
// ──────────────────────────────────────────────────────────────
const getChecklist = async (req, res) => {
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
      `SELECT * FROM packing_checklist
       WHERE trip_id = ?
       ORDER BY category ASC, id ASC`,
      [tripId]
    );

    // Summary counts for the frontend progress bar
    const totalItems  = rows.length;
    const packedItems = rows.filter((r) => r.is_packed).length;

    // Group by category
    const grouped = rows.reduce((acc, item) => {
      const key = item.category || 'General';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    res.json({
      status: 'success',
      data: {
        summary: {
          total:  totalItems,
          packed: packedItems,
          pct:    totalItems > 0
            ? parseFloat(((packedItems / totalItems) * 100).toFixed(1))
            : 0,
        },
        grouped,
        items: rows,   // flat list also provided for convenience
      },
    });
  } catch (err) {
    console.error('[getChecklist]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch checklist.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/trips/:tripId/checklist/:itemId
// Toggle is_packed between 0 and 1
// ──────────────────────────────────────────────────────────────
const toggleItem = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(tripId) || isNaN(itemId)) {
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
    // Fetch current state
    const [existing] = await pool.execute(
      'SELECT * FROM packing_checklist WHERE id = ? AND trip_id = ? LIMIT 1',
      [itemId, tripId]
    );

    if (!existing.length) {
      return res.status(404).json({ status: 'fail', message: 'Checklist item not found.' });
    }

    // Flip the bit
    const newState = existing[0].is_packed ? 0 : 1;

    await pool.execute(
      'UPDATE packing_checklist SET is_packed = ? WHERE id = ?',
      [newState, itemId]
    );

    res.json({
      status: 'success',
      data: {
        item: { ...existing[0], is_packed: newState },
      },
    });
  } catch (err) {
    console.error('[toggleItem]', err);
    res.status(500).json({ status: 'error', message: 'Failed to toggle item.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/trips/:tripId/checklist/:itemId
// Remove a single checklist item
// ──────────────────────────────────────────────────────────────
const deleteChecklistItem = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(tripId) || isNaN(itemId)) {
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
      'DELETE FROM packing_checklist WHERE id = ? AND trip_id = ?',
      [itemId, tripId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ status: 'fail', message: 'Checklist item not found.' });
    }

    res.status(204).send();
  } catch (err) {
    console.error('[deleteChecklistItem]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete checklist item.' });
  }
};

module.exports = { addChecklistItem, getChecklist, toggleItem, deleteChecklistItem };
