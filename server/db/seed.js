const pool = require('./connection');

async function seed() {
  try {
    // 1. Insert dummy user
    const [user] = await pool.query(
      "INSERT IGNORE INTO users (id, name, email, password_hash) VALUES (1, 'Test User', 'test@example.com', 'dummyhash')"
    );
    console.log('User seeded');

    // 2. Insert dummy trip
    const [trip] = await pool.query(
      "INSERT IGNORE INTO trips (id, user_id, title, description) VALUES (1, 1, 'Hackathon Trip', 'A trip to win the hackathon')"
    );
    console.log('Trip seeded');

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
