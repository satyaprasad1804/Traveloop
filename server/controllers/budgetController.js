const pool = require('../config/db');

// ── Helper: verify trip ownership ─────────────────────────────
const verifyTripOwner = async (tripId, userId) => {
  const [rows] = await pool.execute(
    'SELECT id, total_budget, currency, sharing_status FROM trips WHERE id = ? AND user_id = ? LIMIT 1',
    [tripId, userId]
  );
  return rows[0] ?? null;
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/:tripId/budget
// Returns budget vs. actual spend across all stops/activities
// ──────────────────────────────────────────────────────────────
const getBudgetSummary = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  try {
    // SUM activities.cost for all stops belonging to this trip
    const [[{ total_spent }]] = await pool.execute(
      `SELECT COALESCE(SUM(a.cost), 0) AS total_spent
       FROM activities a
       INNER JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = ?`,
      [tripId]
    );

    // Per-category breakdown — useful for pie charts on the frontend
    const [byCategory] = await pool.execute(
      `SELECT a.category,
              COALESCE(SUM(a.cost), 0) AS total,
              COUNT(a.id)              AS count
       FROM activities a
       INNER JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = ?
       GROUP BY a.category
       ORDER BY total DESC`,
      [tripId]
    );

    // Per-city breakdown
    const [byCity] = await pool.execute(
      `SELECT s.city_name,
              COALESCE(SUM(a.cost), 0) AS total,
              COUNT(a.id)              AS activity_count
       FROM stops s
       LEFT JOIN activities a ON a.stop_id = s.id
       WHERE s.trip_id = ?
       GROUP BY s.id, s.city_name
       ORDER BY s.order_index ASC`,
      [tripId]
    );

    const totalBudget = parseFloat(trip.total_budget);
    const totalSpent  = parseFloat(total_spent);
    const remaining   = parseFloat((totalBudget - totalSpent).toFixed(2));
    const pctUsed     = totalBudget > 0
      ? parseFloat(((totalSpent / totalBudget) * 100).toFixed(1))
      : 0;

    res.json({
      status: 'success',
      data: {
        currency:     trip.currency,
        total_budget: totalBudget,
        total_spent:  parseFloat(totalSpent.toFixed(2)),
        remaining,
        pct_used:     pctUsed,
        over_budget:  remaining < 0,
        by_category:  byCategory.map(c => ({ ...c, total: parseFloat(c.total) })),
        by_city:      byCity.map(c => ({ ...c, total: parseFloat(c.total) })),
      },
    });
  } catch (err) {
    console.error('[getBudgetSummary]', err);
    res.status(500).json({ status: 'error', message: 'Failed to calculate budget.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PATCH /api/trips/:tripId/share
// Toggle sharing_status between 'public' and 'private'
// ──────────────────────────────────────────────────────────────
const toggleSharing = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  const trip = await verifyTripOwner(tripId, req.user.id);
  if (!trip) {
    return res.status(403).json({
      status:  'fail',
      message: 'Trip not found or you do not have permission.',
    });
  }

  try {
    // Toggle: public → private, anything else → public
    const newStatus = trip.sharing_status === 'public' ? 'private' : 'public';

    await pool.execute(
      'UPDATE trips SET sharing_status = ? WHERE id = ?',
      [newStatus, tripId]
    );

    res.json({
      status: 'success',
      data: {
        tripId,
        sharing_status: newStatus,
        public_url: newStatus === 'public'
          ? `${process.env.CLIENT_URL || 'http://localhost:5173'}/public/${tripId}`
          : null,
      },
    });
  } catch (err) {
    console.error('[toggleSharing]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update sharing status.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/trips/public/:tripId   — NO protect middleware
// Returns full trip + stops + activities for any public trip
// ──────────────────────────────────────────────────────────────
const getPublicTrip = async (req, res) => {
  const tripId = parseInt(req.params.tripId, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ status: 'fail', message: 'Invalid trip ID.' });
  }

  try {
    // Only serve if sharing_status = 'public'
    const [tripRows] = await pool.execute(
      `SELECT t.id, t.title, t.description, t.start_date, t.end_date,
              t.total_budget, t.currency, t.cover_image_url, t.sharing_status,
              u.name AS owner_name
       FROM trips t
       INNER JOIN users u ON u.id = t.user_id
       WHERE t.id = ? AND t.sharing_status = 'public'
       LIMIT 1`,
      [tripId]
    );

    if (!tripRows.length) {
      return res.status(404).json({
        status:  'fail',
        message: 'This trip is not publicly available.',
      });
    }

    // Fetch stops
    const [stops] = await pool.execute(
      'SELECT * FROM stops WHERE trip_id = ? ORDER BY order_index ASC',
      [tripId]
    );

    // Fetch activities for all stops in one query
    const [activities] = await pool.execute(
      `SELECT a.* FROM activities a
       INNER JOIN stops s ON s.id = a.stop_id
       WHERE s.trip_id = ?
       ORDER BY s.order_index ASC, a.start_time ASC`,
      [tripId]
    );

    // Group activities under their stop
    const stopMap = stops.map((stop) => ({
      ...stop,
      activities: activities.filter((a) => a.stop_id === stop.id),
    }));

    res.json({
      status: 'success',
      data: {
        trip:  tripRows[0],
        stops: stopMap,
      },
    });
  } catch (err) {
    console.error('[getPublicTrip]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch public trip.' });
  }
};

module.exports = { getBudgetSummary, toggleSharing, getPublicTrip };
