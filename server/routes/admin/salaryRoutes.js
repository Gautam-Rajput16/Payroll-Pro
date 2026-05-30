const express = require('express');
const router = express.Router();
const protectAdmin = require('../../middleware/protectAdmin');
const {
  calculateSalaries,
  getSalaries,
  getSalary,
  updateSalaryStatus,
  getSalarySlip,
} = require('../../controllers/admin/salaryController');

// All routes require admin auth
router.use(protectAdmin);

// POST /api/admin/salary/calculate - Calculate salaries for a month
router.post('/calculate', calculateSalaries);

// GET /api/admin/salary/slip/:employeeId - Get salary slip
router.get('/slip/:employeeId', getSalarySlip);

// GET /api/admin/salary - List salary records
router.get('/', getSalaries);

// GET /api/admin/salary/:id - Get single salary record
router.get('/:id', getSalary);

// PATCH /api/admin/salary/:id/status - Update payment status
router.patch('/:id/status', updateSalaryStatus);

module.exports = router;
