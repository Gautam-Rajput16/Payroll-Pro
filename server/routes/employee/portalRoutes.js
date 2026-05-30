const express = require('express');
const router = express.Router();
const protectEmployee = require('../../middleware/protectEmployee');
const {
  getProfile,
  getSalaryRecords,
  getSalarySlip,
  getAdvances,
  getAdvanceSummary,
  getAttendance,
  getDashboard,
} = require('../../controllers/employee/portalController');

// All routes require employee auth
router.use(protectEmployee);

// GET /api/employee/portal/dashboard - Employee dashboard
router.get('/dashboard', getDashboard);

// GET /api/employee/portal/profile - Own profile
router.get('/profile', getProfile);

// GET /api/employee/portal/salary - Own salary records
router.get('/salary', getSalaryRecords);

// GET /api/employee/portal/salary/:month/:year - Salary slip for month
router.get('/salary/:month/:year', getSalarySlip);

// GET /api/employee/portal/advances/summary - Advance summary by month
router.get('/advances/summary', getAdvanceSummary);

// GET /api/employee/portal/advances - Own advance history
router.get('/advances', getAdvances);

// GET /api/employee/portal/attendance - Own attendance history
router.get('/attendance', getAttendance);

module.exports = router;
