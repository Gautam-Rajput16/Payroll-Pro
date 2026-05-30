const Employee = require('../../models/Employee');
const Advance = require('../../models/Advance');
const Attendance = require('../../models/Attendance');
const Salary = require('../../models/Salary');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

/**
 * @desc    Get admin dashboard stats
 * @route   GET /api/v1/admin/dashboard
 * @access  Private (Admin)
 */
const getDashboard = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // 1. Employee Stats
    const totalEmployees = await Employee.countDocuments({ orgId, isDeleted: false });
    const activeEmployees = await Employee.countDocuments({ orgId, status: 'Active', isDeleted: false });
    const inactiveEmployees = await Employee.countDocuments({ orgId, status: 'Inactive', isDeleted: false });

    // 2. Advances this month
    const advancesAgg = await Advance.aggregate([
      {
        $match: {
          orgId,
          isDeleted: false,
          $expr: {
            $and: [
              { $eq: [{ $month: '$date' }, currentMonth] },
              { $eq: [{ $year: '$date' }, currentYear] },
            ],
          },
        },
      },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
    ]);

    const totalAdvancesThisMonth = advancesAgg.length > 0 ? advancesAgg[0].count : 0;
    const totalAdvancesThisMonthAmount = advancesAgg.length > 0 ? advancesAgg[0].totalAmount : 0;

    // 3. Salary Stats this month
    const salaryAgg = await Salary.aggregate([
      {
        $match: {
          orgId,
          month: currentMonth,
          year: currentYear,
          isDeleted: false
        },
      },
      {
        $group: {
          _id: '$paymentStatus',
          totalAmount: { $sum: '$netSalary' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalSalaryPending = 0;
    let totalSalaryPendingAmount = 0;
    let totalSalaryPaid = 0;
    let totalSalaryPaidAmount = 0;

    salaryAgg.forEach((stat) => {
      if (stat._id === 'Pending') {
        totalSalaryPending = stat.count;
        totalSalaryPendingAmount = stat.totalAmount;
      }
      if (stat._id === 'Paid') {
        totalSalaryPaid = stat.count;
        totalSalaryPaidAmount = stat.totalAmount;
      }
    });

    // 4. Pending Attendance for this month
    const attendanceRecords = await Attendance.find({ orgId, month: currentMonth, year: currentYear, isDeleted: false }).lean();
    const recordedEmpIds = attendanceRecords.map((r) => r.employeeId.toString());
    
    // Only count active employees who joined before/during this month
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
    const employeesNeedingAttendance = await Employee.countDocuments({
      orgId,
      status: 'Active',
      isDeleted: false,
      joiningDate: { $lte: endOfMonth },
      _id: { $nin: recordedEmpIds },
    });

    // 5. Recent Activity
    const recentAdvances = await Advance.find({ orgId, isDeleted: false })
      .populate('employeeId', 'name employeeId')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentSalaryCalculations = await Salary.find({ orgId, isDeleted: false })
      .populate('employeeId', 'name employeeId')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return successResponse(res, 200, 'Dashboard data fetched successfully', {
      totalEmployees,
      activeEmployees,
      inactiveEmployees,
      totalAdvancesThisMonth,
      totalAdvancesThisMonthAmount,
      totalSalaryPending,
      totalSalaryPendingAmount,
      totalSalaryPaid,
      totalSalaryPaidAmount,
      employeesWithPendingAttendance: employeesNeedingAttendance,
      recentAdvances,
      recentSalaryCalculations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboard };
