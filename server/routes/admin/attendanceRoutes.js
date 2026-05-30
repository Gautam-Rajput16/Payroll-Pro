const express = require('express');
const router = express.Router();
const protectAdmin = require('../../middleware/protectAdmin');
const {
  getAttendance,
  bulkUpsertAttendance,
  updateAttendance,
  finalizeAttendance,
  getEmployeeAttendance,
  getAttendanceStatus,
} = require('../../controllers/admin/attendanceController');
const {
  attendanceBulkValidationRules,
  attendanceUpdateValidationRules,
  attendanceFinalizeValidationRules,
  validate,
} = require('../../validators/attendanceValidator');

// All routes require admin auth
router.use(protectAdmin);

// GET /api/admin/attendance/status - Get attendance status overview
router.get('/status', getAttendanceStatus);

// GET /api/admin/attendance/employee/:employeeId - Employee attendance history
router.get('/employee/:employeeId', getEmployeeAttendance);

// GET /api/admin/attendance - Get attendance for a month
router.get('/', getAttendance);

// POST /api/admin/attendance/bulk - Bulk upsert attendance
router.post('/bulk', attendanceBulkValidationRules(), validate, bulkUpsertAttendance);

// POST /api/admin/attendance/finalize - Finalize attendance for a month
router.post('/finalize', attendanceFinalizeValidationRules(), validate, finalizeAttendance);

// PATCH /api/admin/attendance/:id - Update single attendance record
router.patch('/:id', attendanceUpdateValidationRules(), validate, updateAttendance);

module.exports = router;
