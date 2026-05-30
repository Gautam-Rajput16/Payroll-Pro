const Advance = require('../../models/Advance');
const Employee = require('../../models/Employee');
const Salary = require('../../models/Salary');
const { generateTransactionId } = require('../../utils/autoIdGenerator');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { createAuditLog, sanitizeForAudit } = require('../../utils/auditLogger');

/**
 * @desc    Get all advances (paginated, filterable)
 * @route   GET /api/v1/admin/advances
 * @access  Private (Admin)
 */
const getAdvances = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const {
      employeeId, month, year,
      startDate, endDate,
      minAmount, maxAmount,
      paymentMode, page = 1, limit = 10,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter
    const filter = { orgId };
    if (employeeId) filter.employeeId = employeeId;
    if (paymentMode) filter.paymentMode = paymentMode;

    // Date range filter
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) {
        filter.date.$gte = new Date(new Date(startDate).setHours(0, 0, 0, 0));
      }
      if (endDate) {
        filter.date.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
      }
    }

    // Month/Year filter (if no date range)
    if (month && year && !startDate && !endDate) {
      const m = parseInt(month);
      const y = parseInt(year);
      const startOfMonth = new Date(y, m - 1, 1);
      const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);
      filter.date = { $gte: startOfMonth, $lte: endOfMonth };
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      filter.amount = {};
      if (minAmount) filter.amount.$gte = parseFloat(minAmount);
      if (maxAmount) filter.amount.$lte = parseFloat(maxAmount);
    }

    const total = await Advance.countDocuments(filter);

    const advances = await Advance.find(filter)
      .populate('employeeId', 'name employeeId designation')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Calculate total amount for filtered results - explicit isDeleted check for aggregate
    const aggregateFilter = { ...filter, isDeleted: false };
    const totalAmountAgg = await Advance.aggregate([
      { $match: aggregateFilter },
      { $group: { _id: null, totalAmount: { $sum: '$amount' } } },
    ]);
    const totalAmount = totalAmountAgg.length > 0 ? totalAmountAgg[0].totalAmount : 0;

    return successResponse(res, 200, 'Advances fetched successfully', { advances, totalAmount }, {
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
 * @desc    Create a new advance payment
 * @route   POST /api/v1/admin/advances
 * @access  Private (Admin)
 */
const createAdvance = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { employeeId, date, amount, paymentMode, reason, status, notes } = req.body;

    // Verify employee belongs to this org and is active
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }
    if (employee.orgId.toString() !== orgId.toString()) {
      return errorResponse(res, 403, 'Employee does not belong to your organisation');
    }
    if (employee.status !== 'Active') {
      return errorResponse(res, 400, 'Cannot add advance for inactive employee');
    }

    // Auto-generate transactionId
    const transactionId = await generateTransactionId();

    const advance = await Advance.create({
      orgId,
      transactionId,
      employeeId,
      date,
      amount,
      paymentMode,
      status: status || 'Pending',
      reason: reason || '',
      notes: notes || '',
      createdBy: req.user.userId,
    });

    createAuditLog({
      orgId,
      action: 'CREATE',
      module: 'Advance',
      documentId: advance._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      newData: sanitizeForAudit(advance),
      req,
    });

    // Populate employee info for response
    const populatedAdvance = await Advance.findById(advance._id)
      .populate('employeeId', 'name employeeId designation')
      .lean();

    return successResponse(res, 201, 'Advance payment created successfully', populatedAdvance);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single advance details
 * @route   GET /api/v1/admin/advances/:id
 * @access  Private (Admin)
 */
const getAdvance = async (req, res, next) => {
  try {
    const advance = await Advance.findById(req.params.id)
      .populate('employeeId', 'name employeeId designation phone')
      .lean();

    if (!advance) {
      return errorResponse(res, 404, 'Advance not found');
    }

    if (advance.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    return successResponse(res, 200, 'Advance details fetched', advance);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update advance payment
 * @route   PUT /api/v1/admin/advances/:id
 * @access  Private (Admin)
 */
const updateAdvance = async (req, res, next) => {
  try {
    const advance = await Advance.findById(req.params.id);

    if (!advance) {
      return errorResponse(res, 404, 'Advance not found');
    }

    if (advance.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    const oldData = sanitizeForAudit(advance);
    const { date, amount, paymentMode, reason, status, notes } = req.body;

    if (date !== undefined) advance.date = date;
    if (amount !== undefined) advance.amount = amount;
    if (paymentMode !== undefined) advance.paymentMode = paymentMode;
    if (reason !== undefined) advance.reason = reason;
    if (status !== undefined) advance.status = status;
    if (notes !== undefined) advance.notes = notes;

    advance.updatedBy = req.user.userId;
    await advance.save();

    createAuditLog({
      orgId: req.user.orgId,
      action: 'UPDATE',
      module: 'Advance',
      documentId: advance._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(advance),
      req,
    });

    const populatedAdvance = await Advance.findById(advance._id)
      .populate('employeeId', 'name employeeId designation')
      .lean();

    return successResponse(res, 200, 'Advance updated successfully', populatedAdvance);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft Delete advance (blocked if salary already calculated for that month)
 * @route   DELETE /api/v1/admin/advances/:id
 * @access  Private (Admin)
 */
const deleteAdvance = async (req, res, next) => {
  try {
    const advance = await Advance.findById(req.params.id);

    if (!advance) {
      return errorResponse(res, 404, 'Advance not found');
    }

    if (advance.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    // Check if salary already calculated for this advance's month/year
    const advanceDate = new Date(advance.date);
    const month = advanceDate.getMonth() + 1;
    const year = advanceDate.getFullYear();

    const salaryExists = await Salary.findOne({
      orgId: req.user.orgId,
      employeeId: advance.employeeId,
      month,
      year,
    });

    if (salaryExists) {
      return errorResponse(res, 400, 'Cannot delete advance after salary is calculated for this month. Recalculate salary after making changes.');
    }

    const oldData = sanitizeForAudit(advance);

    // Soft delete
    advance.isDeleted = true;
    advance.deletedAt = new Date();
    advance.deletedBy = req.user.userId;
    await advance.save();

    createAuditLog({
      orgId: req.user.orgId,
      action: 'SOFT_DELETE',
      module: 'Advance',
      documentId: advance._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(advance),
      req,
    });

    return successResponse(res, 200, 'Advance deleted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get advance summary grouped by employee for a month
 * @route   GET /api/v1/admin/advances/summary
 * @access  Private (Admin)
 */
const getAdvanceSummary = async (req, res, next) => {
  try {
    const orgId = req.user.orgId;
    const { month, year } = req.query;

    if (!month || !year) {
      return errorResponse(res, 400, 'Month and year are required');
    }

    const m = parseInt(month);
    const y = parseInt(year);
    const startOfMonth = new Date(y, m - 1, 1);
    const endOfMonth = new Date(y, m, 0, 23, 59, 59, 999);

    const summary = await Advance.aggregate([
      {
        $match: {
          orgId: orgId,
          isDeleted: false,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: '$employeeId',
          totalAdvances: { $sum: '$amount' },
          advanceCount: { $sum: 1 },
          advances: { $push: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'employees',
          localField: '_id',
          foreignField: '_id',
          as: 'employeeInfo',
        },
      },
      { $unwind: '$employeeInfo' },
      {
        $project: {
          employeeId: '$_id',
          employeeName: '$employeeInfo.name',
          employeeCode: '$employeeInfo.employeeId',
          totalAdvances: 1,
          advanceCount: 1,
          advances: 1,
        },
      },
      { $sort: { employeeName: 1 } },
    ]);

    return successResponse(res, 200, 'Advance summary fetched', summary);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all advances for a specific employee grouped by month
 * @route   GET /api/v1/admin/advances/employee/:employeeId
 * @access  Private (Admin)
 */
const getEmployeeAdvances = async (req, res, next) => {
  try {
    // Verify employee belongs to this org
    const employee = await Employee.findById(req.params.employeeId);
    if (!employee) {
      return errorResponse(res, 404, 'Employee not found');
    }
    if (employee.orgId.toString() !== req.user.orgId.toString()) {
      return errorResponse(res, 403, 'Access denied');
    }

    const advances = await Advance.aggregate([
      {
        $match: {
          employeeId: employee._id,
          orgId: req.user.orgId,
          isDeleted: false,
        },
      },
      { $sort: { date: -1 } },
      {
        $group: {
          _id: {
            month: { $month: '$date' },
            year: { $year: '$date' },
          },
          advances: { $push: '$$ROOT' },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
    ]);

    return successResponse(res, 200, 'Employee advances fetched', {
      employee: { _id: employee._id, name: employee.name, employeeId: employee.employeeId },
      advancesByMonth: advances,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAdvances,
  createAdvance,
  getAdvance,
  updateAdvance,
  deleteAdvance,
  getAdvanceSummary,
  getEmployeeAdvances,
};
