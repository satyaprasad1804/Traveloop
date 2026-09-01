const express = require('express');
const { protect, adminOnly } = require('../middleware/authMiddleware');
const { getStats } = require('../controllers/adminController');

const router = express.Router();

// Require both authentication and admin authorization
router.use(protect);
router.use(adminOnly);

// GET /api/admin/stats — platform-wide analytics
router.get('/stats', getStats);

module.exports = router;
