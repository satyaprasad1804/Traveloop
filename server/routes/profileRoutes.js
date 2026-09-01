const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getProfile, updateProfile, changePassword, deleteAccount,
} = require('../controllers/profileController');

const router = express.Router();

router.use(protect);

// GET    /api/profile          — fetch own profile
// PUT    /api/profile          — update name / email / avatar
// DELETE /api/profile          — delete account
router.route('/')
  .get(getProfile)
  .put(updateProfile)
  .delete(deleteAccount);

// PUT /api/profile/password    — change password
router.put('/password', changePassword);

module.exports = router;
