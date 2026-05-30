const Attendance = require('../../models/Attendance');
const Employee = require('../../models/Employee');
const Salary = require('../../models/Salary');
const Organisation = require('../../models/Organisation');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { createAuditLog, sanitizeForAudit } = require('../../utils/auditLogger');

/**
 * @desc    Get attendance for a specific month
 * @route   GET /api/v1/admin/attendance
 * @access  Private (Admin)
 */
const getAttendance = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { month, year } = req.query;

    if (!month || !year) {
      return errorResponse(res, 400, 'Month and year are required');
    }

    const attendanceRecords = await Attendance.find({
      orgId,
      month: parseInt(month),
      year: parseInt(year),
    })
      .populate('employeeId', 'name employeeId designation status')
      .lean();

    return successResponse(res, 200, 'Attendance fetched successfully', attendanceRecords);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Bulk upsert attendance (creates or updates for multiple employees)
 * @route   POST /api/v1/admin/attendance/bulk
 * @access  Private (Admin)
 */
const bulkUpsertAttendance = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { month, year, records } = req.body;

    if (!records || !Array.isArray(records) || records.length === 0) {
      return errorResponse(res, 400, 'No attendance records provided');
    }

    // Check if salary is already calculated for this month
    const salaryExists = await Salary.findOne({ orgId, month, year, isDeleted: false });
    if (salaryExists) {
      return errorResponse(res, 400, 'Cannot modify attendance: salaries have already been calculated for this month');
    }

    // Check if attendance is already finalized
    const finalizedAttendance = await Attendance.findOne({
      orgId,
      month,
      year,
      status: 'Finalized',
    });
    if (finalizedAttendance) {
      return errorResponse(res, 400, 'Cannot modify attendance: attendance for this month is already finalized');
    }

    const org = await Organisation.findById(orgId);
    const defaultWorkingDays = org.defaultWorkingDays;

    const upsertPromises = records.map(async (record) => {
      // Find existing to check if it's an update
      const existing = await Attendance.findOne({
        orgId,
        employeeId: record.employeeId,
        month,
        year,
      });

      const oldData = existing ? sanitizeForAudit(existing) : null;
      const action = existing ? 'UPDATE' : 'CREATE';

      const updated = await Attendance.findOneAndUpdate(
        {
          orgId,
          employeeId: record.employeeId,
          month,
          year,
        },
        {
          $set: {
            presentDays: record.presentDays,
            workingDays: record.workingDays || defaultWorkingDays,
            status: 'Draft',
            updatedBy: existing ? req.user.userId : null,
            createdBy: existing ? undefined : req.user.userId,
            // If it was soft-deleted, restore it
            isDeleted: false,
            deletedAt: null,
            deletedBy: null
          },
        },
        { new: true, upsert: true, runValidators: true }
      );

      createAuditLog({
        orgId: req.user.orgId,
        action,
        module: 'Attendance',
        documentId: updated._id,
        performedBy: req.user.userId,
        performedByName: req.user.name,
        oldData,
        newData: sanitizeForAudit(updated),
        req,
      });

      return updated;
    });

    await Promise.all(upsertPromises);

    return successResponse(res, 200, 'Attendance records saved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update single attendance record
 * @route   PATCH /api/v1/admin/attendance/:id
 * @access  Private (Admin)
 */
const updateAttendance = async (req, res, next) => {
  try {
    const { presentDays, workingDays } = req.body;
    const attendance = await Attendance.findById(req.params.id);

    if (!attendance) {
      return errorResponse(res, 404, 'Attendance record not found');
    }

    if (attendance.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    if (attendance.status === 'Finalized') {
      return errorResponse(res, 400, 'Cannot modify finalized attendance');
    }

    const oldData = sanitizeForAudit(attendance);

    if (presentDays !== undefined) attendance.presentDays = presentDays;
    if (workingDays !== undefined) attendance.workingDays = workingDays;

    attendance.updatedBy = req.user.userId;
    await attendance.save();

    createAuditLog({
      orgId: req.user.orgId,
      action: 'UPDATE',
      module: 'Attendance',
      documentId: attendance._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(attendance),
      req,
    });

    const populated = await Attendance.findById(attendance._id)
      .populate('employeeId', 'name employeeId')
      .lean();

    return successResponse(res, 200, 'Attendance updated successfully', populated);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Finalize attendance for a month
 * @route   POST /api/v1/admin/attendance/finalize
 * @access  Private (Admin)
 */
const finalizeAttendance = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { month, year } = req.body;

    const count = await Attendance.countDocuments({
      orgId,
      month,
      year,
      status: 'Draft',
    });

    if (count === 0) {
      return errorResponse(res, 400, 'No draft attendance records found to finalize');
    }

    // We don't individually audit log 500 records finalizing.
    // Instead we log one 'FINALIZE' action.
    await Attendance.updateMany(
      { orgId, month, year, status: 'Draft' },
      { $set: { status: 'Finalized', updatedBy: req.user.userId } }
    );

    createAuditLog({
      orgId: req.user.orgId,
      action: 'FINALIZE',
      module: 'Attendance',
      performedBy: req.user.userId,
      performedByName: req.user.name,
      newData: { month, year, recordsUpdated: count },
      req,
    });

    return successResponse(res, 200, `Successfully finalized ${count} attendance records for ${month}/${year}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get attendance status (Missing, Draft, Finalized)
 * @route   GET /api/v1/admin/attendance/status
 * @access  Private (Admin)
 */
const getAttendanceStatus = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { month, year } = req.query;

    if (!month || !year) {
      return errorResponse(res, 400, 'Month and year are required');
    }

    const m = parseInt(month);
    const y = parseInt(year);

    // Get all active employees who joined before or during this month
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
    const activeEmployees = await Employee.find({
      orgId,
      status: 'Active',
      joiningDate: { $lte: endOfMonth },
    }).lean();

    const totalExpected = activeEmployees.length;

    // Get existing records
    const attendanceRecords = await Attendance.find({ orgId, month: m, year: y }).lean();

    const finalizedCount = attendanceRecords.filter((r) => r.status === 'Finalized').length;
    const draftCount = attendanceRecords.filter((r) => r.status === 'Draft').length;
    const missingCount = totalExpected - (finalizedCount + draftCount);

    // Find who is missing
    const recordedEmpIds = attendanceRecords.map((r) => r.employeeId.toString());
    const missingEmployees = activeEmployees.filter(
      (emp) => !recordedEmpIds.includes(emp._id.toString())
    );

    return successResponse(res, 200, 'Attendance status fetched', {
      totalExpected,
      finalizedCount,
      draftCount,
      missingCount: Math.max(0, missingCount),
      missingEmployees: missingEmployees.map((e) => ({
        _id: e._id,
        name: e.name,
        employeeId: e.employeeId,
      })),
      isReadyForSalaryCalculation: totalExpected > 0 && missingCount <= 0 && draftCount === 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single employee's attendance history
 * @route   GET /api/v1/admin/attendance/employee/:employeeId
 * @access  Private (Admin)
 */
const getEmployeeAttendance = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }
    if (employee.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    const attendance = await Attendance.find({
      orgId: req.user.orgId,
      employeeId: employee._id,
    })
      .sort({ year: -1, month: -1 })
      .lean();

    return successResponse(res, 200, 'Employee attendance history fetched', attendance);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAttendance,
  bulkUpsertAttendance,
  updateAttendance,
  finalizeAttendance,
  getAttendanceStatus,
  getEmployeeAttendance,
};
