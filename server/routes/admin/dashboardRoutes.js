const express = require('express');
const router = express.Router();
const protectAdmin = require('../../middleware/protectAdmin');
const { getDashboard } = require('../../controllers/admin/dashboardController');

// All routes require admin auth
router.use(protectAdmin);

// GET /api/admin/dashboard - Dashboard stats
router.get('/', getDashboard);

module.exports = router;
