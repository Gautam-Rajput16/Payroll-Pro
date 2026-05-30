const express = require('express');
const router = express.Router();
const protectAdmin = require('../../middleware/protectAdmin');
const {
  getEmployeeReport,
  getAdvanceReport,
  getSalaryReport,
  getFullEmployeeReport,
} = require('../../controllers/admin/reportController');

// All routes require admin auth
router.use(protectAdmin);

// GET /api/admin/reports/employees - Employee list report
router.get('/employees', getEmployeeReport);

// GET /api/admin/reports/advances - Advance report
router.get('/advances', getAdvanceReport);

// GET /api/admin/reports/salary - Salary report
router.get('/salary', getSalaryReport);

// GET /api/admin/reports/employee/:employeeId/full - Full employee report
router.get('/employee/:employeeId/full', getFullEmployeeReport);

module.exports = router;
