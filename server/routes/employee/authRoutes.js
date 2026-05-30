const express = require('express');
const router = express.Router();
const { login, getMe, changePassword } = require('../../controllers/employee/authController');
const protectEmployee = require('../../middleware/protectEmployee');

// POST /api/employee/auth/login - Employee login
router.post('/login', login);

// GET /api/employee/auth/me - Get current employee profile
router.get('/me', protectEmployee, getMe);

// PATCH /api/employee/auth/change-password - Change password
router.patch('/change-password', protectEmployee, changePassword);

module.exports = router;
