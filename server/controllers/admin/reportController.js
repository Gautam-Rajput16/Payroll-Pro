const Employee = require('../../models/Employee');
const Advance = require('../../models/Advance');
const Attendance = require('../../models/Attendance');
const Salary = require('../../models/Salary');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

/**
 * @desc    Get Employee List Report
 * @route   GET /api/v1/admin/reports/employees
 * @access  Private (Admin)
 */
const getEmployeeReport = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { orgId: req.user.orgId, isDeleted: false };
    if (status) filter.status = status;

    const employees = await Employee.find(filter)
      .select('-__v -updatedAt')
      .sort({ createdAt: -1 })
      .lean();

    return successResponse(res, 200, 'Employee report generated', employees);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Advance Report
 * @route   GET /api/v1/admin/reports/advances
 * @access  Private (Admin)
 */
const getAdvanceReport = async (req, res, next) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const filter = { orgId: req.user.orgId, isDeleted: false };

    if (employeeId) filter.employeeId = employeeId;

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    const advances = await Advance.find(filter)
      .populate('employeeId', 'name employeeId designation status')
      .sort({ date: -1 })
      .lean();

    const totalAmount = advances.reduce((sum, adv) => sum + adv.amount, 0);

    return successResponse(res, 200, 'Advance report generated', {
      count: advances.length,
      totalAmount,
      data: advances,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Salary Report
 * @route   GET /api/v1/admin/reports/salary
 * @access  Private (Admin)
 */
const getSalaryReport = async (req, res, next) => {
  try {
    const { month, year, paymentStatus, employeeId } = req.query;
    const filter = { orgId: req.user.orgId, isDeleted: false };

    if (month) filter.month = parseInt(month);
    if (year) filter.year = parseInt(year);
    if (paymentStatus) filter.paymentStatus = paymentStatus;
    if (employeeId) filter.employeeId = employeeId;

    const salaries = await Salary.find(filter)
      .populate('employeeId', 'name employeeId designation bankName accountNumber ifscCode')
      .sort({ year: -1, month: -1 })
      .lean();

    const summary = salaries.reduce(
      (acc, curr) => {
        acc.totalGross += curr.grossSalary;
        acc.totalNet += curr.netSalary;
        acc.totalAdvancesDeducted += curr.totalAdvances;
        return acc;
      },
      { totalGross: 0, totalNet: 0, totalAdvancesDeducted: 0 }
    );

    return successResponse(res, 200, 'Salary report generated', {
      count: salaries.length,
      summary,
      data: salaries,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Full Employee Report (Employee + Attendance + Advances + Salary)
 * @route   GET /api/v1/admin/reports/employee/:employeeId/full
 * @access  Private (Admin)
 */
const getFullEmployeeReport = async (req, res, next) => {
  try {
    const { year } = req.query;
    if (!year) {
      return errorResponse(res, 400, 'Year is required for full report');
    }

    const employee = await Employee.findOne({
      _id: req.params.employeeId,
      orgId: req.user.orgId,
      isDeleted: false
    }).lean();

    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    const y = parseInt(year);
    const startOfYear = new Date(y, 0, 1);
    const endOfYear = new Date(y, 11, 31, 23, 59, 59, 999);

    // Fetch all related data for the year
    const attendance = await Attendance.find({
      employeeId: employee._id,
      orgId: req.user.orgId,
      year: y,
      isDeleted: false
    }).sort({ month: 1 }).lean();

    const advances = await Advance.find({
      employeeId: employee._id,
      orgId: req.user.orgId,
      date: { $gte: startOfYear, $lte: endOfYear },
      isDeleted: false
    }).sort({ date: 1 }).lean();

    const salaries = await Salary.find({
      employeeId: employee._id,
      orgId: req.user.orgId,
      year: y,
      isDeleted: false
    }).sort({ month: 1 }).lean();

    return successResponse(res, 200, 'Full employee report generated', {
      year: y,
      employee,
      attendance,
      advances,
      salaries,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployeeReport,
  getAdvanceReport,
  getSalaryReport,
  getFullEmployeeReport,
};
