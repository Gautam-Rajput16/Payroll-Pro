const express = require('express');
const router = express.Router();
const protectAdmin = require('../../middleware/protectAdmin');
const {
  getEmployees,
  createEmployee,
  getEmployee,
  getEmployeeProfile,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  resetPortalPassword,
} = require('../../controllers/admin/employeeController');
const {
  employeeValidationRules,
  employeeUpdateValidationRules,
  validate,
} = require('../../validators/employeeValidator');

// All routes require admin auth
router.use(protectAdmin);

// GET /api/admin/employees - List employees
router.get('/', getEmployees);

// POST /api/admin/employees - Create employee
router.post('/', employeeValidationRules(), validate, createEmployee);

// GET /api/admin/employees/:id - Get single employee
router.get('/:id', getEmployee);

// GET /api/admin/employees/:id/profile - Get employee full profile with history
router.get('/:id/profile', getEmployeeProfile);

// PUT /api/admin/employees/:id - Update employee
router.put('/:id', employeeUpdateValidationRules(), validate, updateEmployee);

// PATCH /api/admin/employees/:id/status - Toggle employee status
router.patch('/:id/status', updateEmployeeStatus);

// DELETE /api/admin/employees/:id - Delete employee
router.delete('/:id', deleteEmployee);

// PATCH /api/admin/employees/:id/reset-portal-password - Reset employee portal password
router.patch('/:id/reset-portal-password', resetPortalPassword);

module.exports = router;
