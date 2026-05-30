const express = require('express');
const router = express.Router();
const { login, getMe, changePassword } = require('../../controllers/admin/authController');
const protectAdmin = require('../../middleware/protectAdmin');

// POST /api/admin/auth/login - Admin login
router.post('/login', login);

// GET /api/admin/auth/me - Get current admin profile
router.get('/me', protectAdmin, getMe);

// PATCH /api/admin/auth/change-password - Change admin password
router.patch('/change-password', protectAdmin, changePassword);

module.exports = router;
