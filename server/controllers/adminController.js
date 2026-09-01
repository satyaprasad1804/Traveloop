const pool = require('../config/db');

// ──────────────────────────────────────────────────────────────
// GET /api/admin/stats
// Platform-wide analytics — admin only
// ──────────────────────────────────────────────────────────────
const getStats = async (req, res) => {
  try {
    const [[{ total_users }]]      = await pool.execute('SELECT COUNT(*) AS total_users FROM users');
    const [[{ total_trips }]]      = await pool.execute('SELECT COUNT(*) AS total_trips FROM trips');
    const [[{ total_activities }]] = await pool.execute('SELECT COUNT(*) AS total_activities FROM activities');
    const [[{ total_stops }]]      = await pool.execute('SELECT COUNT(*) AS total_stops FROM stops');

    // Top 10 most visited cities
    const [top_cities] = await pool.execute(
      `SELECT city_name, COUNT(*) AS visit_count
       FROM stops
       GROUP BY city_name
       ORDER BY visit_count DESC
       LIMIT 10`
    );

    // Top 10 activities by category
    const [top_categories] = await pool.execute(
      `SELECT category, COUNT(*) AS count, ROUND(SUM(cost),2) AS total_cost
       FROM activities
       GROUP BY category
       ORDER BY count DESC`
    );

    // Trips created per day (last 30 days)
    const [trips_over_time] = await pool.execute(
      `SELECT DATE(created_at) AS date, COUNT(*) AS count
       FROM trips
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date ASC`
    );

    // Recent users
    const [recent_users] = await pool.execute(
      `SELECT id, name, email, created_at,
              (SELECT COUNT(*) FROM trips WHERE trips.user_id = users.id) AS trip_count
       FROM users
       ORDER BY created_at DESC
       LIMIT 20`
    );

    // Public vs private trips
    const [sharing_breakdown] = await pool.execute(
      `SELECT sharing_status, COUNT(*) AS count
       FROM trips
       GROUP BY sharing_status`
    );

    res.json({
      status: 'success',
      data: {
        totals: {
          users: total_users,
          trips: total_trips,
          activities: total_activities,
          stops: total_stops,
        },
        top_cities,
        top_categories,
        trips_over_time,
        recent_users,
        sharing_breakdown,
      },
    });
  } catch (err) {
    console.error('[getStats]', err);
    res.status(500).json({ status: 'error', message: 'Failed to fetch admin stats.' });
  }
};

module.exports = { getStats };
