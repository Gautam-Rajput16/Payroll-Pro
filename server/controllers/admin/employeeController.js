const mongoose = require('mongoose');
const Employee = require('../../models/Employee');
const User = require('../../models/User');
const Advance = require('../../models/Advance');
const Attendance = require('../../models/Attendance');
const Salary = require('../../models/Salary');
const { generateEmployeeId } = require('../../utils/autoIdGenerator');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { createAuditLog, sanitizeForAudit } = require('../../utils/auditLogger');

/**
 * @desc    Get all employees for this org (paginated, searchable)
 * @route   GET /api/v1/admin/employees
 * @access  Private (Admin)
 */
const getEmployees = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { search, status, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { orgId };
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Employee.countDocuments(filter);
    const employees = await Employee.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    return successResponse(res, 200, 'Employees fetched successfully', employees, {
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
 * @desc    Create a new employee with auto-generated user account
 * @route   POST /api/v1/admin/employees
 * @access  Private (Admin)
 */
const createEmployee = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const orgId = req.user.orgId;
    const {
      name, phone, email, address,
      designation, joiningDate, monthlySalary,
      bankName, accountNumber, ifscCode, status,
    } = req.body;

    // Step 1: Auto-generate employeeId
    const empId = await generateEmployeeId();

    // Step 2: Create Employee document
    const employee = await Employee.create(
      [
        {
          orgId,
          employeeId: empId,
          name,
          phone,
          email: email || '',
          address: address || '',
          designation: designation || '',
          joiningDate,
          monthlySalary,
          bankName: bankName || '',
          accountNumber: accountNumber || '',
          ifscCode: ifscCode || '',
          status: status || 'Active',
          createdBy: req.user.userId,
        },
      ],
      { session }
    );

    // Step 3: Auto-create User account for employee
    const userEmail = email ? email : `${phone}@${orgId}.com`;
    const defaultPassword = empId;

    const userAccount = await User.create(
      [
        {
          name,
          email: userEmail,
          password: defaultPassword,
          role: 'employee',
          orgId,
          employeeId: employee[0]._id,
          isFirstLogin: true,
          status: 'active',
          createdBy: req.user.userId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    createAuditLog({
      orgId,
      action: 'CREATE',
      module: 'Employee',
      documentId: employee[0]._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      newData: sanitizeForAudit(employee[0]),
      req,
    });

    createAuditLog({
      orgId,
      action: 'CREATE',
      module: 'User',
      documentId: userAccount[0]._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      newData: sanitizeForAudit(userAccount[0]),
      req,
    });

    return successResponse(res, 201, 'Employee created successfully', {
      employee: employee[0],
      loginCredentials: {
        email: userEmail,
        defaultPassword: empId,
        note: 'Employee must change password on first login',
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * @desc    Get single employee details
 * @route   GET /api/v1/admin/employees/:id
 * @access  Private (Admin)
 */
const getEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();

    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    if (employee.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied. Employee does not belong to your organisation.');
    }

    return successResponse(res, 200, 'Employee details fetched', employee);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get employee full profile with advance, attendance, salary history
 * @route   GET /api/v1/admin/employees/:id/profile
 * @access  Private (Admin)
 */
const getEmployeeProfile = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).lean();

    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    if (employee.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied. Employee does not belong to your organisation.');
    }

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get all related data
    const advanceHistory = await Advance.find({ employeeId: employee._id, orgId: req.user.orgId })
      .sort({ date: -1 })
      .lean();

    const attendanceHistory = await Attendance.find({ employeeId: employee._id, orgId: req.user.orgId })
      .sort({ year: -1, month: -1 })
      .lean();

    const salaryHistory = await Salary.find({ employeeId: employee._id, orgId: req.user.orgId })
      .sort({ year: -1, month: -1 })
      .lean();

    // Current month advance total
    const currentMonthAdvances = await Advance.aggregate([
      {
        $match: {
          employeeId: employee._id,
          orgId: req.user.orgId,
          isDeleted: false,
          $expr: {
            $and: [
              { $eq: [{ $month: '$date' }, currentMonth] },
              { $eq: [{ $year: '$date' }, currentYear] },
            ],
          },
        },
      },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);

    // Current month attendance
    const currentMonthAttendance = await Attendance.findOne({
      employeeId: employee._id,
      orgId: req.user.orgId,
      month: currentMonth,
      year: currentYear,
    }).lean();

    return successResponse(res, 200, 'Employee profile fetched', {
      employee,
      advanceHistory,
      attendanceHistory,
      salaryHistory,
      currentMonthAdvanceTotal: currentMonthAdvances.length > 0 ? currentMonthAdvances[0].total : 0,
      currentMonthAttendance: currentMonthAttendance || null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update employee details
 * @route   PUT /api/v1/admin/employees/:id
 * @access  Private (Admin)
 */
const updateEmployee = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);

    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    if (employee.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied. Employee does not belong to your organisation.');
    }

    const oldData = sanitizeForAudit(employee);
    const previousSalary = employee.monthlySalary;

    // Update allowed fields
    const updatableFields = [
      'name', 'phone', 'email', 'address', 'designation',
      'joiningDate', 'monthlySalary', 'bankName', 'accountNumber',
      'ifscCode', 'status',
    ];

    updatableFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        employee[field] = req.body[field];
      }
    });

    employee.updatedBy = req.user.userId;
    await employee.save();

    createAuditLog({
      orgId: req.user.orgId,
      action: 'UPDATE',
      module: 'Employee',
      documentId: employee._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(employee),
      req,
    });

    const salaryChanged = previousSalary !== employee.monthlySalary;

    return successResponse(res, 200, 'Employee updated successfully', {
      employee,
      salaryChanged,
      note: salaryChanged ? 'Salary change will affect future calculations only, not past records.' : undefined,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle employee status (Active/Inactive)
 * @route   PATCH /api/v1/admin/employees/:id/status
 * @access  Private (Admin)
 */
const updateEmployeeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return errorResponse(res, 400, 'Status must be Active or Inactive');
    }

    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    if (employee.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    const oldData = sanitizeForAudit(employee);

    employee.status = status;
    employee.updatedBy = req.user.userId;
    await employee.save();

    // Also update linked user account status
    const userStatus = status === 'Active' ? 'active' : 'inactive';
    await User.findOneAndUpdate(
      { employeeId: employee._id, role: 'employee', isDeleted: false },
      { status: userStatus, updatedBy: req.user.userId }
    );

    createAuditLog({
      orgId: req.user.orgId,
      action: 'STATUS_CHANGE',
      module: 'Employee',
      documentId: employee._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(employee),
      req,
    });

    return successResponse(res, 200, `Employee status updated to ${status}`, employee);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft Delete employee (blocked if salary history exists)
 * @route   DELETE /api/v1/admin/employees/:id
 * @access  Private (Admin)
 */
const deleteEmployee = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const employee = await Employee.findById(req.params.id).session(session);
    if (!employee) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 404, 'Employee not found');
    }

    if (employee.orgId.toString() !== req.user.orgId.toString()) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 403, 'Access denied');
    }

    // Check if employee has salary records
    const salaryCount = await Salary.countDocuments({ employeeId: employee._id }).session(session);
    if (salaryCount > 0) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 400, 'Cannot delete employee with salary history. Deactivate instead.');
    }

    const oldData = sanitizeForAudit(employee);
    const now = new Date();
    const updatePayload = {
      isDeleted: true,
      deletedAt: now,
      deletedBy: req.user.userId
    };

    // Soft delete related data (advances, attendance)
    await Advance.updateMany({ employeeId: employee._id }, { $set: updatePayload }, { session });
    await Attendance.updateMany({ employeeId: employee._id }, { $set: updatePayload }, { session });

    // Soft delete linked user account
    await User.updateOne({ employeeId: employee._id, role: 'employee' }, { $set: updatePayload }, { session });

    // Soft delete employee
    employee.isDeleted = true;
    employee.deletedAt = now;
    employee.deletedBy = req.user.userId;
    await employee.save({ session });

    await session.commitTransaction();
    session.endSession();

    createAuditLog({
      orgId: req.user.orgId,
      action: 'SOFT_DELETE',
      module: 'Employee',
      documentId: employee._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(employee),
      req,
    });

    return successResponse(res, 200, 'Employee deleted successfully');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * @desc    Reset employee portal password back to employeeId
 * @route   PATCH /api/v1/admin/employees/:id/reset-portal-password
 * @access  Private (Admin)
 */
const resetPortalPassword = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }

    if (employee.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Find linked user account
    const user = await User.findOne({ employeeId: employee._id, role: 'employee', isDeleted: false });
    if (!user) {
      return errorResponse(res, 404, 'Employee user account not found');
    }

    // Reset password to employeeId and set isFirstLogin
    user.password = employee.employeeId;
    user.isFirstLogin = true;
    user.updatedBy = req.user.userId;
    await user.save(); // pre-save hook will hash

    createAuditLog({
      orgId: req.user.orgId,
      action: 'PASSWORD_RESET',
      module: 'User',
      documentId: user._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      req,
    });

    return successResponse(res, 200, 'Employee portal password reset successfully', {
      defaultPassword: employee.employeeId,
      note: 'Employee must change password on next login',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getEmployees,
  createEmployee,
  getEmployee,
  getEmployeeProfile,
  updateEmployee,
  updateEmployeeStatus,
  deleteEmployee,
  resetPortalPassword,
};
