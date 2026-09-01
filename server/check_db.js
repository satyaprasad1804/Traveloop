require('dotenv').config();
const pool = require('./config/db');

(async () => {
  try {
    // 1. Test basic connection
    const [ping] = await pool.query('SELECT 1+1 AS result');
    console.log('✅ DB connection OK:', ping[0].result);

    // 2. List all tables
    const [tables] = await pool.query('SHOW TABLES');
    console.log('\n📋 Tables in odoo_hackathon:');
    tables.forEach(t => console.log('  -', Object.values(t)[0]));

    // 3. Try to create trip_notes and capture detailed error if any
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
      console.log('\n✅ trip_notes table created/already exists');
    } catch (err) {
      console.error('\n❌ trip_notes creation failed:');
      console.error('  Code   :', err.code);
      console.error('  Message:', err.message);
    }

  } catch (err) {
    console.error('❌ DB connection failed:', err.message);
  } finally {
    process.exit(0);
  }
})();
