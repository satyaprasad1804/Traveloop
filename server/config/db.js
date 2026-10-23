const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * mysql2/promise connection pool.
 * All DB modules import this pool and call pool.query() / pool.execute().
 * Set DB_SSL=true in .env to enable SSL (required for Aiven / Railway / cloud DBs).
 */
const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               process.env.DB_PORT     || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASSWORD || '',
  database:           process.env.DB_NAME     || 'odoo_hackathon',
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
  timezone:           'Z',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
});

module.exports = pool;
