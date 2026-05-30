const express = require('express');
const router = express.Router();
const { login, getMe } = require('../../controllers/superadmin/authController');
const protectSuperAdmin = require('../../middleware/protectSuperAdmin');

// POST /api/superadmin/auth/login - Superadmin login
router.post('/login', login);

// GET /api/superadmin/auth/me - Get current superadmin profile
router.get('/me', protectSuperAdmin, getMe);

module.exports = router;
