const jwt  = require('jsonwebtoken');
const pool = require('../config/db');

/**
 * protect — Express middleware
 *
 * Expects:  Authorization: Bearer <token>
 * On pass:  attaches req.user = { id, name, email, ... } and calls next()
 * On fail:  returns 401 JSON error
 */
const protect = async (req, res, next) => {
  // 1. Extract token from header
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      status:  'fail',
      message: 'Access denied. No token provided.',
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify & decode
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Confirm user still exists in DB (handles deleted / suspended accounts)
    const [rows] = await pool.execute(
      'SELECT id, name, email, avatar_url, role FROM users WHERE id = ? LIMIT 1',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({
        status:  'fail',
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // 4. Attach user to request and continue
    req.user = rows[0];
    next();
  } catch (err) {
    const message =
      err.name === 'TokenExpiredError'
        ? 'Your session has expired. Please log in again.'
        : 'Invalid token. Please log in again.';

    return res.status(401).json({ status: 'fail', message });
  }
};

/**
 * adminOnly — Express middleware
 *
 * Pre-requisite: Must be mounted AFTER protect middleware.
 * Expects: req.user contains role
 * On pass: calls next()
 * On fail: returns 403 JSON error
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      status:  'fail',
      message: 'Access denied. Administrator privileges required.',
    });
  }
};

module.exports = { protect, adminOnly };
