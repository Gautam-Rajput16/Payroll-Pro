const express = require('express');
const router = express.Router();
const protectAdmin = require('../../middleware/protectAdmin');
const {
  getAdvances,
  createAdvance,
  getAdvance,
  updateAdvance,
  deleteAdvance,
  getAdvanceSummary,
  getEmployeeAdvances,
} = require('../../controllers/admin/advanceController');
const {
  advanceValidationRules,
  advanceUpdateValidationRules,
  validate,
} = require('../../validators/advanceValidator');

// All routes require admin auth
router.use(protectAdmin);

// GET /api/admin/advances/summary - Advance summary by employee (must be before /:id)
router.get('/summary', getAdvanceSummary);

// GET /api/admin/advances/employee/:employeeId - Advances for specific employee
router.get('/employee/:employeeId', getEmployeeAdvances);

// GET /api/admin/advances - List all advances
router.get('/', getAdvances);

// POST /api/admin/advances - Create advance
router.post('/', advanceValidationRules(), validate, createAdvance);

// GET /api/admin/advances/:id - Get single advance
router.get('/:id', getAdvance);

// PUT /api/admin/advances/:id - Update advance
router.put('/:id', advanceUpdateValidationRules(), validate, updateAdvance);

// DELETE /api/admin/advances/:id - Delete advance
router.delete('/:id', deleteAdvance);

module.exports = router;
