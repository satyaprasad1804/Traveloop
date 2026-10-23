require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const fs      = require('fs');
const path    = require('path');
const pool    = require('./config/db');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Global Middleware ──────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Health / DB Test Route ─────────────────────────────────────
app.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT 1 + 1 AS result');
    res.json({
      status:  'ok',
      message: '🌍 Traveloop API is running',
      db_test: rows[0].result,  // should be 2
    });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

// ── API Routes ────────────────────────────────────────────────
app.use('/api/auth',    require('./routes/authRoutes'));
app.use('/api/profile', require('./routes/profileRoutes'));
app.use('/api/admin',   require('./routes/adminRoutes'));

// Budget router first — catches /api/trips/public/:tripId BEFORE
// tripRoutes can swallow 'public' as a /:id param
app.use('/api/trips',  require('./routes/budgetRoutes'));
app.use('/api/trips',  require('./routes/tripRoutes'));
app.use('/api/trips/:tripId/stops',      require('./routes/stopRoutes'));
app.use('/api/trips/:tripId/checklist',  require('./routes/checklistRoutes'));
app.use('/api/trips/:tripId/notes',      require('./routes/notesRoutes'));
app.use('/api/stops/:stopId/activities', require('./routes/activityRoutes'));

// ── 404 Handler ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route not found' });
});

// ── Global Error Handler ──────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    status:  'error',
    message: err.message || 'Internal Server Error',
  });
});

// ── Auto-migrate: run full schema + extras on startup ────────────────────────
(async () => {
  try {
    const schemaPath = path.join(__dirname, 'db', 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !/^(CREATE DATABASE|USE )/i.test(s));

    for (const stmt of statements) {
      try {
        await pool.execute(stmt);
      } catch (err) {
        if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DUP_KEYNAME') {
          console.warn('⚠️  Migration stmt skipped:', err.message);
        }
      }
    }
    console.log('✅  Schema migration complete');
  } catch (err) {
    console.warn('⚠️  Schema migration failed:', err.message);
  }

  // Ensure trip_notes table (added after initial schema)
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS trip_notes (
        id         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
        trip_id    INT UNSIGNED   NOT NULL,
        title      VARCHAR(200)       NULL DEFAULT NULL,
        content    TEXT           NOT NULL,
        created_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        CONSTRAINT fk_notes_trip FOREIGN KEY (trip_id) REFERENCES trips (id) ON DELETE CASCADE ON UPDATE CASCADE,
        KEY idx_notes_trip (trip_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('✅  trip_notes table ready');
  } catch (err) {
    if (err.code !== 'ER_TABLE_EXISTS_ERROR') console.warn('⚠️  trip_notes:', err.message);
  }

  // Ensure role column on users
  try {
    const [cols] = await pool.execute("SHOW COLUMNS FROM users LIKE 'role'");
    if (cols.length === 0) {
      await pool.execute("ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'user'");
      console.log('✅  role column added to users table');
    }
  } catch (err) {
    console.warn('⚠️  role column:', err.message);
  }
})();

// ── Start Server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  Traveloop server running on http://localhost:${PORT}`);
});
