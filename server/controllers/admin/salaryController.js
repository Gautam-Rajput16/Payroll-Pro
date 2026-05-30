const mongoose = require('mongoose');
const Salary = require('../../models/Salary');
const Employee = require('../../models/Employee');
const Advance = require('../../models/Advance');
const Attendance = require('../../models/Attendance');
const Organisation = require('../../models/Organisation');
const { calculateSalary } = require('../../utils/salaryCalculator');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { createAuditLog } = require('../../utils/auditLogger');

/**
 * @desc    Calculate and generate salaries for a specific month
 * @route   POST /api/v1/admin/salary/calculate
 * @access  Private (Admin)
 */
const calculateSalaries = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orgId = req.user.orgId;
    const { month, year } = req.body;

    // 1. Verify attendance is finalized
    const unfinalizedAttendance = await Attendance.countDocuments({
      orgId,
      month,
      year,
      status: { $ne: 'Finalized' },
    }).session(session);

    if (unfinalizedAttendance > 0) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 400, 'Cannot calculate salary. All attendance records must be finalized first.');
    }

    const attendanceRecords = await Attendance.find({ orgId, month, year, status: 'Finalized' }).session(session);

    if (attendanceRecords.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 400, 'No finalized attendance records found for this month.');
    }

    // 2. Get organization info
    const org = await Organisation.findById(orgId).session(session);

    // 3. Process each employee's salary
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

    const salaryPromises = attendanceRecords.map(async (attendance) => {
      const employee = await Employee.findById(attendance.employeeId).session(session);

      if (!employee) return null; // Skip if employee was hard deleted (shouldn't happen with soft deletes)

      // Get advances for this month (excluding soft-deleted ones)
      const advances = await Advance.find({
        orgId,
        employeeId: employee._id,
        date: { $gte: startOfMonth, $lte: endOfMonth },
        isDeleted: false
      }).session(session);

      const totalAdvances = advances.reduce((sum, adv) => sum + adv.amount, 0);

      // Calculate
      const { perDaySalary, grossSalary, netSalary } = calculateSalary(
        employee.monthlySalary,
        attendance.workingDays,
        attendance.presentDays,
        totalAdvances
      );

      // SNAPSHOT DATA - Store current details so historical slips never change
      // Upsert Salary Record
      const salaryRecord = await Salary.findOneAndUpdate(
        {
          orgId,
          employeeId: employee._id,
          month,
          year,
        },
        {
          $set: {
            employeeNameSnapshot: employee.name,
            employeeCodeSnapshot: employee.employeeId,
            designationSnapshot: employee.designation,
            monthlySalarySnapshot: employee.monthlySalary,
            workingDaysSnapshot: attendance.workingDays,
            presentDays: attendance.presentDays,
            perDaySalary,
            grossSalary,
            totalAdvances,
            netSalary,
            createdBy: req.user.userId,
            isDeleted: false,
            deletedAt: null,
            deletedBy: null
          },
        },
        { new: true, upsert: true, session }
      );

      return salaryRecord;
    });

    await Promise.all(salaryPromises);

    await session.commitTransaction();
    session.endSession();

    createAuditLog({
      orgId,
      action: 'CALCULATE',
      module: 'Salary',
      performedBy: req.user.userId,
      performedByName: req.user.name,
      newData: { month, year, recordsCalculated: attendanceRecords.length },
      req,
    });

    return successResponse(res, 200, `Successfully calculated salaries for ${attendanceRecords.length} employees`);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * @desc    Get all calculated salaries for a month (paginated)
 * @route   GET /api/v1/admin/salary
 * @access  Private (Admin)
 */
const getSalaries = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { month, year, paymentStatus, page = 1, limit = 10 } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const filter = { orgId };
    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const total = await Salary.countDocuments(filter);

    const salaries = await Salary.find(filter)
      .populate('employeeId', 'name employeeId designation bankName accountNumber ifscCode')
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Aggregates need explicit isDeleted: false
    const aggregateFilter = { ...filter, isDeleted: false };
    const summaryAgg = await Salary.aggregate([
      { $match: aggregateFilter },
      {
        $group: {
          _id: null,
          totalNetSalary: { $sum: '$netSalary' },
          totalGrossSalary: { $sum: '$grossSalary' },
          totalAdvancesDeducted: { $sum: '$totalAdvances' },
        },
      },
    ]);

    const summary = summaryAgg.length > 0 ? summaryAgg[0] : { totalNetSalary: 0, totalGrossSalary: 0, totalAdvancesDeducted: 0 };
    delete summary._id;

    return successResponse(res, 200, 'Salaries fetched successfully', { salaries, summary }, {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single salary record
 * @route   GET /api/v1/admin/salary/:id
 * @access  Private (Admin)
 */
const getSalary = async (req, res, next) => {
  try {
    const salary = await Salary.findById(req.params.id)
      .populate('employeeId', 'name employeeId designation bankName accountNumber ifscCode')
      .lean();

    if (!salary) {
      return errorResponse(res, 404, 'Salary record not found');
    }

    if (salary.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    return successResponse(res, 200, 'Salary details fetched', salary);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update payment status (Pending -> Paid)
 * @route   PATCH /api/v1/admin/salary/:id/status
 * @access  Private (Admin)
 */
const updateSalaryStatus = async (req, res, next) => {
  try {
    const { paymentStatus } = req.body;

    if (!['Pending', 'Paid'].includes(paymentStatus)) {
      return errorResponse(res, 400, 'Invalid payment status');
    }

    const salary = await Salary.findById(req.params.id);

    if (!salary) {
      return errorResponse(res, 404, 'Salary record not found');
    }

    if (salary.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    salary.paymentStatus = paymentStatus;
    if (paymentStatus === 'Paid') {
      salary.paidAt = new Date();
    } else {
      salary.paidAt = null;
    }
    salary.updatedBy = req.user.userId;

    await salary.save();

    createAuditLog({
      orgId: req.user.orgId,
      action: 'STATUS_CHANGE',
      module: 'Salary',
      documentId: salary._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      newData: { paymentStatus, paidAt: salary.paidAt },
      req,
    });

    return successResponse(res, 200, `Salary status updated to ${paymentStatus}`);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get detailed salary slip data
 * @route   GET /api/v1/admin/salary/slip/:employeeId
 * @access  Private (Admin)
 */
const getSalarySlip = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return errorResponse(res, 400, 'Month and year are required');
    }

    const m = parseInt(month);
    const y = parseInt(year);

    const salary = await Salary.findOne({
      orgId: req.user.orgId,
      employeeId: req.params.employeeId,
      month: m,
      year: y,
    }).lean();

    if (!salary) {
      return errorResponse(res, 404, 'Salary slip not found for this month');
    }

    const org = await Organisation.findById(req.user.orgId).lean();
    const employee = await Employee.findById(req.params.employeeId).lean();

    // Get advance breakdown
    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    const advanceBreakdown = await Advance.find({
      orgId: req.user.orgId,
      employeeId: req.params.employeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
    })
      .sort({ date: 1 })
      .lean();

    // Use snapshot data from salary record to ensure historical accuracy
    return successResponse(res, 200, 'Salary slip fetched', {
      organisationName: org.orgName,
      organisationLogo: org.orgLogo,
      orgAddress: org.address,
      employeeName: salary.employeeNameSnapshot || employee.name, // Fallback for old data
      employeeId: salary.employeeCodeSnapshot || employee.employeeId,
      designation: salary.designationSnapshot || employee.designation,
      salaryMonth: m,
      salaryYear: y,
      monthlySalary: salary.monthlySalarySnapshot || salary.monthlySalary, // Fallback for old data
      workingDays: salary.workingDaysSnapshot || salary.workingDays, // Fallback for old data
      presentDays: salary.presentDays,
      perDaySalary: salary.perDaySalary,
      grossSalary: salary.grossSalary,
      totalAdvances: salary.totalAdvances,
      advanceBreakdown,
      netSalary: salary.netSalary,
      paymentStatus: salary.paymentStatus,
      paidAt: salary.paidAt,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  calculateSalaries,
  getSalaries,
  getSalary,
  updateSalaryStatus,
  getSalarySlip,
};
