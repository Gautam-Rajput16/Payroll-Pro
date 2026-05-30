const Employee = require('../../models/Employee');
const Advance = require('../../models/Advance');
const Attendance = require('../../models/Attendance');
const Salary = require('../../models/Salary');
const Organisation = require('../../models/Organisation');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

/**
 * @desc    Get own employee profile (bank details hidden)
 * @route   GET /api/v1/employee/portal/profile
 * @access  Private (Employee)
 */
const getProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ _id: req.user.employeeId, isDeleted: false })
      .select('-bankName -accountNumber -ifscCode')
      .lean();

    if (!employee) {
      return errorResponse(res, 404, 'Employee profile not found or has been deleted');
    }

    return successResponse(res, 200, 'Profile fetched', employee);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get own salary records
 * @route   GET /api/v1/employee/portal/salary
 * @access  Private (Employee)
 */
const getSalaryRecords = async (req, res, next) => {
  try {
    const salaries = await Salary.find({
      employeeId: req.user.employeeId,
      orgId: req.user.orgId,
      isDeleted: false,
      paymentStatus: { $in: ['Pending', 'Paid'] },
    })
      .sort({ year: -1, month: -1 })
      .lean();

    return successResponse(res, 200, 'Salary records fetched', salaries);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get own salary slip for a specific month/year
 * @route   GET /api/v1/employee/portal/salary/:month/:year
 * @access  Private (Employee)
 */
const getSalarySlip = async (req, res, next) => {
  try {
    const m = parseInt(req.params.month);
    const y = parseInt(req.params.year);

    const employee = await Employee.findById(req.user.employeeId).lean();
    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    const org = await Organisation.findById(req.user.orgId).lean();

    const salary = await Salary.findOne({
      employeeId: req.user.employeeId,
      orgId: req.user.orgId,
      month: m,
      year: y,
      isDeleted: false
    }).lean();

    if (!salary) {
      return errorResponse(res, 404, 'Salary slip not found for this month');
    }

    // Get advance breakdown
    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    const advanceBreakdown = await Advance.find({
      orgId: req.user.orgId,
      employeeId: req.user.employeeId,
      date: { $gte: startOfMonth, $lte: endOfMonth },
      isDeleted: false
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

/**
 * @desc    Get own advance history
 * @route   GET /api/v1/employee/portal/advances
 * @access  Private (Employee)
 */
const getAdvances = async (req, res, next) => {
  try {
    const { month, year } = req.query;

    const filter = {
      employeeId: req.user.employeeId,
      orgId: req.user.orgId,
      isDeleted: false
    };

    if (month && year) {
      const m = parseInt(month);
      const y = parseInt(year);
      filter.date = {
        $gte: new Date(y, m - 1, 1),
        $lte: new Date(y, m, 0, 23, 59, 59, 999),
      };
    }

    const advances = await Advance.find(filter)
      .sort({ date: -1 })
      .lean();

    return successResponse(res, 200, 'Advances fetched', advances);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get own advance summary grouped by month
 * @route   GET /api/v1/employee/portal/advances/summary
 * @access  Private (Employee)
 */
const getAdvanceSummary = async (req, res, next) => {
  try {
    const summary = await Advance.aggregate([
      {
        $match: {
          employeeId: req.user.employeeId,
          orgId: req.user.orgId,
          isDeleted: false
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' },
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]);

    return successResponse(res, 200, 'Advance summary fetched', summary);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get own attendance history
 * @route   GET /api/v1/employee/portal/attendance
 * @access  Private (Employee)
 */
const getAttendance = async (req, res, next) => {
  try {
    const attendance = await Attendance.find({
      employeeId: req.user.employeeId,
      orgId: req.user.orgId,
      isDeleted: false
    })
      .sort({ year: -1, month: -1 })
      .lean();

    return successResponse(res, 200, 'Attendance history fetched', attendance);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get employee portal dashboard
 * @route   GET /api/v1/employee/portal/dashboard
 * @access  Private (Employee)
 */
const getDashboard = async (req, res, next) => {
  try {
    const employee = await Employee.findOne({ _id: req.user.employeeId, isDeleted: false })
      .select('name designation employeeId monthlySalary')
      .lean();

    if (!employee) {
      return errorResponse(res, 404, 'Employee not found or has been deleted');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Current month salary
    const currentMonthSalary = await Salary.findOne({
      employeeId: req.user.employeeId,
      orgId: req.user.orgId,
      month: currentMonth,
      year: currentYear,
      isDeleted: false
    }).lean();

    // Current month attendance
    const currentMonthAttendance = await Attendance.findOne({
      employeeId: req.user.employeeId,
      orgId: req.user.orgId,
      month: currentMonth,
      year: currentYear,
      isDeleted: false
    }).lean();

    // Current month advances
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);

    const currentMonthAdvancesAgg = await Advance.aggregate([
      {
        $match: {
          employeeId: req.user.employeeId,
          orgId: req.user.orgId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
          isDeleted: false
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    // Last paid salary
    const lastPaidSalary = await Salary.findOne({
      employeeId: req.user.employeeId,
      orgId: req.user.orgId,
      paymentStatus: 'Paid',
      isDeleted: false
    })
      .sort({ year: -1, month: -1 })
      .lean();

    // Total advances all time
    const totalAdvancesAllTime = await Advance.aggregate([
      {
        $match: {
          employeeId: req.user.employeeId,
          orgId: req.user.orgId,
          isDeleted: false
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    return successResponse(res, 200, 'Dashboard data fetched', {
      employeeName: employee.name,
      designation: employee.designation,
      currentMonthSalary: currentMonthSalary || null,
      currentMonthAttendance: currentMonthAttendance || null,
      currentMonthAdvances: {
        total: currentMonthAdvancesAgg.length > 0 ? currentMonthAdvancesAgg[0].total : 0,
        count: currentMonthAdvancesAgg.length > 0 ? currentMonthAdvancesAgg[0].count : 0,
      },
      lastPaidSalary: lastPaidSalary || null,
      totalAdvancesAllTime: totalAdvancesAllTime.length > 0 ? totalAdvancesAllTime[0].total : 0,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getProfile,
  getSalaryRecords,
  getSalarySlip,
  getAdvances,
  getAdvanceSummary,
  getAttendance,
  getDashboard,
};
