const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const Joi     = require('joi');
const pool    = require('../config/db');

// ── Joi Validation Schemas ─────────────────────────────────────
const registerSchema = Joi.object({
  name:     Joi.string().min(2).max(120).required(),
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

// ── Helper: Sign JWT ───────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );

// ── Helper: Safe user response (strip password_hash) ──────────
const sanitizeUser = ({ id, name, email, avatar_url, role, created_at }) => ({
  id, name, email, avatar_url, role, created_at,
});

// ──────────────────────────────────────────────────────────────
// POST /api/auth/register
// ──────────────────────────────────────────────────────────────
const register = async (req, res) => {
  // 1. Validate input
  const { error, value } = registerSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status:  'fail',
      errors:  error.details.map((d) => d.message),
    });
  }

  const { name, email, password } = value;

  try {
    // 2. Check for duplicate email
    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    if (existing.length > 0) {
      return res.status(409).json({
        status:  'fail',
        message: 'An account with this email already exists.',
      });
    }

    // 3. Hash password (saltRounds = 12)
    const password_hash = await bcrypt.hash(password, 12);

    // 4. Insert user
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, password_hash]
    );

    // 5. Fetch newly created user
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [result.insertId]
    );

    const user  = rows[0];
    const token = signToken(user.id);

    res.status(201).json({
      status: 'success',
      token,
      data:   { user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error('[register]', err);
    res.status(500).json({ status: 'error', message: 'Server error during registration.' });
  }
};

// ──────────────────────────────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────────────────────────────
const login = async (req, res) => {
  // 1. Validate input
  const { error, value } = loginSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  const { email, password } = value;

  try {
    // 2. Find user (always fetch password_hash for comparison)
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    const user = rows[0];

    // 3. Compare password — use a constant-time check to prevent timing attacks
    const isMatch = user ? await bcrypt.compare(password, user.password_hash) : false;

    // 4. Generic error for both "user not found" and "wrong password"
    if (!user || !isMatch) {
      return res.status(401).json({
        status:  'fail',
        message: 'Invalid email or password.',
      });
    }

    // 5. Sign and return token
    const token = signToken(user.id);

    res.json({
      status: 'success',
      token,
      data:   { user: sanitizeUser(user) },
    });
  } catch (err) {
    console.error('[login]', err);
    res.status(500).json({ status: 'error', message: 'Server error during login.' });
  }
};

// ──────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected — needs authMiddleware)
// ──────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }
    res.json({ status: 'success', data: { user: sanitizeUser(rows[0]) } });
  } catch (err) {
    console.error('[getMe]', err);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

module.exports = { register, login, getMe };
