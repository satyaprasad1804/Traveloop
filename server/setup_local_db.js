/**
 * setup_local_db.js — applies Traveloop schema to the configured MySQL DB
 * Usage: node setup_local_db.js
 * Reads credentials from .env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, DB_SSL)
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function main() {
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'odoo_hackathon',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : undefined,
  });
  console.log('✅  Connected to MySQL.');

  const schemaPath = path.join(__dirname, 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !/^(CREATE DATABASE|USE )/i.test(s));

  for (const stmt of statements) {
    try {
      await conn.query(stmt);
    } catch (err) {
      if (err.code !== 'ER_TABLE_EXISTS_ERROR' && err.code !== 'ER_DUP_KEYNAME') {
        console.warn(`⚠️  Skipped: ${err.message}`);
      }
    }
  }
  console.log('✅  Schema applied successfully.');
  await conn.end();
}

main().catch(err => {
  console.error('❌  Setup failed:', err.message);
  process.exit(1);
});
