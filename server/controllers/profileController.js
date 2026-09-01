const Joi    = require('joi');
const bcrypt = require('bcryptjs');
const pool   = require('../config/db');

// ── Joi Schema ─────────────────────────────────────────────────
const updateProfileSchema = Joi.object({
  name:       Joi.string().min(2).max(120).optional(),
  email:      Joi.string().email().optional(),
  avatar_url: Joi.string().uri().optional().allow('', null),
});

const changePasswordSchema = Joi.object({
  current_password: Joi.string().min(6).required(),
  new_password:     Joi.string().min(6).max(128).required(),
});

// ──────────────────────────────────────────────────────────────
// GET /api/profile
// Return the logged-in user's profile
// ──────────────────────────────────────────────────────────────
const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    // Attach trip count
    const [[{ trip_count }]] = await pool.execute(
      'SELECT COUNT(*) AS trip_count FROM trips WHERE user_id = ?',
      [req.user.id]
    );

    res.json({
      status: 'success',
      data: { user: { ...rows[0], trip_count } },
    });
  } catch (err) {
    console.error('[getProfile]', err);
    res.status(500).json({ status: 'error', message: 'Server error.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/profile
// Update name, email, and/or avatar_url
// ──────────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  if (Object.keys(value).length === 0) {
    return res.status(400).json({ status: 'fail', message: 'No fields to update.' });
  }

  try {
    // Check email uniqueness if changing
    if (value.email) {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ? AND id != ? LIMIT 1',
        [value.email, req.user.id]
      );
      if (existing.length) {
        return res.status(409).json({
          status:  'fail',
          message: 'This email is already in use by another account.',
        });
      }
    }

    const fields = Object.keys(value).map((k) => `${k} = ?`).join(', ');
    const vals   = [...Object.values(value), req.user.id];

    await pool.execute(`UPDATE users SET ${fields} WHERE id = ?`, vals);

    const [rows] = await pool.execute(
      'SELECT id, name, email, avatar_url, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    res.json({ status: 'success', data: { user: rows[0] } });
  } catch (err) {
    console.error('[updateProfile]', err);
    res.status(500).json({ status: 'error', message: 'Failed to update profile.' });
  }
};

// ──────────────────────────────────────────────────────────────
// PUT /api/profile/password
// Change password
// ──────────────────────────────────────────────────────────────
const changePassword = async (req, res) => {
  const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false });
  if (error) {
    return res.status(422).json({
      status: 'fail',
      errors: error.details.map((d) => d.message),
    });
  }

  try {
    const [rows] = await pool.execute(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ status: 'fail', message: 'User not found.' });
    }

    const isMatch = await bcrypt.compare(value.current_password, rows[0].password_hash);
    if (!isMatch) {
      return res.status(401).json({ status: 'fail', message: 'Current password is incorrect.' });
    }

    const newHash = await bcrypt.hash(value.new_password, 12);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    res.json({ status: 'success', message: 'Password updated successfully.' });
  } catch (err) {
    console.error('[changePassword]', err);
    res.status(500).json({ status: 'error', message: 'Failed to change password.' });
  }
};

// ──────────────────────────────────────────────────────────────
// DELETE /api/profile
// Delete the user's account (cascade deletes all trips)
// ──────────────────────────────────────────────────────────────
const deleteAccount = async (req, res) => {
  try {
    await pool.execute('DELETE FROM users WHERE id = ?', [req.user.id]);
    res.status(204).send();
  } catch (err) {
    console.error('[deleteAccount]', err);
    res.status(500).json({ status: 'error', message: 'Failed to delete account.' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, deleteAccount };
