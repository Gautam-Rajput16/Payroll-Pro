const mongoose = require('mongoose');
const Organisation = require('../../models/Organisation');
const User = require('../../models/User');
const Employee = require('../../models/Employee');
const Advance = require('../../models/Advance');
const Attendance = require('../../models/Attendance');
const Salary = require('../../models/Salary');
const { generateOrgId } = require('../../utils/autoIdGenerator');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');
const { createAuditLog, sanitizeForAudit } = require('../../utils/auditLogger');

/**
 * @desc    Get all organisations with admin info, filters, and pagination
 * @route   GET /api/v1/superadmin/organisations
 * @access  Private (Super Admin)
 */
const getAllOrganisations = async (req, res, next) => {
  try {
    const { status, plan, page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Build filter - automatically filters isDeleted via middleware
    const filter = {};
    if (status) filter.status = status;
    if (plan) filter.plan = plan;

    // Get total count
    const total = await Organisation.countDocuments(filter);

    // Fetch organisations
    const organisations = await Organisation.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Attach admin info and employee count for each org
    const orgsWithDetails = await Promise.all(
      organisations.map(async (org) => {
        // User queries are NOT auto-filtered for isDeleted, so we explicitly add it
        const admin = await User.findOne({ orgId: org._id, role: 'admin', isDeleted: false })
          .select('name email status')
          .lean();
        const employeeCount = await Employee.countDocuments({ orgId: org._id });

        return {
          ...org,
          admin: admin || null,
          employeeCount,
        };
      })
    );

    return successResponse(res, 200, 'Organisations fetched successfully', orgsWithDetails, {
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
 * @desc    Create a new organisation with its admin account
 * @route   POST /api/v1/superadmin/organisations
 * @access  Private (Super Admin)
 */
const createOrganisation = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      orgName,
      address,
      phone,
      email,
      plan,
      defaultWorkingDays,
      adminName,
      adminEmail,
      adminPassword,
    } = req.body;

    // Check if admin email already exists (even in deleted records to avoid conflicts)
    const existingUser = await User.findOne({ email: adminEmail }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 400, 'Admin email already exists');
    }

    // Step 1: Auto-generate orgId and create Organisation
    const orgId = await generateOrgId();
    const organisation = await Organisation.create(
      [
        {
          orgId,
          orgName,
          address: address || '',
          phone: phone || '',
          email: email || '',
          plan: plan || 'free',
          defaultWorkingDays: defaultWorkingDays || 26,
          createdBySuperAdmin: true,
          createdBy: req.user.userId,
        },
      ],
      { session }
    );

    // Step 2: Create Admin User linked to the organisation
    const adminUser = await User.create(
      [
        {
          name: adminName,
          email: adminEmail,
          password: adminPassword,
          role: 'admin',
          orgId: organisation[0]._id,
          isFirstLogin: true,
          status: 'active',
          createdBy: req.user.userId,
        },
      ],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Create Audit Logs
    createAuditLog({
      orgId: organisation[0]._id,
      action: 'CREATE',
      module: 'Organisation',
      documentId: organisation[0]._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      newData: sanitizeForAudit(organisation[0]),
      req,
    });

    createAuditLog({
      orgId: organisation[0]._id,
      action: 'CREATE',
      module: 'User',
      documentId: adminUser[0]._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      newData: sanitizeForAudit(adminUser[0]),
      req,
    });

    return successResponse(res, 201, 'Organisation and admin created successfully', {
      organisation: organisation[0],
      admin: {
        _id: adminUser[0]._id,
        name: adminUser[0].name,
        email: adminUser[0].email,
        role: adminUser[0].role,
        isFirstLogin: adminUser[0].isFirstLogin,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * @desc    Get single organisation details with stats
 * @route   GET /api/v1/superadmin/organisations/:orgId
 * @access  Private (Super Admin)
 */
const getOrganisation = async (req, res, next) => {
  try {
    const organisation = await Organisation.findById(req.params.orgId).lean();
    if (!organisation) {
      return errorResponse(res, 404, 'Organisation not found');
    }

    // Get admin info (explicitly filter isDeleted: false)
    const admin = await User.findOne({ orgId: organisation._id, role: 'admin', isDeleted: false })
      .select('name email status isFirstLogin')
      .lean();

    // Get stats
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const totalEmployees = await Employee.countDocuments({ orgId: organisation._id });
    
    // Aggregations don't trigger pre-query middleware, so we must add isDeleted: false
    const totalAdvancesThisMonth = await Advance.aggregate([
      {
        $match: {
          orgId: organisation._id,
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

    const salaryStats = await Salary.aggregate([
      { $match: { orgId: organisation._id, month: currentMonth, year: currentYear, isDeleted: false } },
      {
        $group: {
          _id: '$paymentStatus',
          total: { $sum: '$netSalary' },
          count: { $sum: 1 },
        },
      },
    ]);

    let totalSalaryPaid = 0;
    let totalSalaryPending = 0;
    salaryStats.forEach((stat) => {
      if (stat._id === 'Paid') totalSalaryPaid = stat.total;
      if (stat._id === 'Pending') totalSalaryPending = stat.total;
    });

    return successResponse(res, 200, 'Organisation details fetched', {
      organisation,
      admin,
      stats: {
        totalEmployees,
        totalAdvancesThisMonth:
          totalAdvancesThisMonth.length > 0 ? totalAdvancesThisMonth[0].total : 0,
        totalSalaryPaid,
        totalSalaryPending,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update organisation details
 * @route   PUT /api/v1/superadmin/organisations/:orgId
 * @access  Private (Super Admin)
 */
const updateOrganisation = async (req, res, next) => {
  try {
    const { orgName, plan, address, phone, email, orgLogo, defaultWorkingDays, currency } = req.body;

    const organisation = await Organisation.findById(req.params.orgId);
    if (!organisation) {
      return errorResponse(res, 404, 'Organisation not found');
    }

    const oldData = sanitizeForAudit(organisation);

    // Update fields
    if (orgName !== undefined) organisation.orgName = orgName;
    if (plan !== undefined) organisation.plan = plan;
    if (address !== undefined) organisation.address = address;
    if (phone !== undefined) organisation.phone = phone;
    if (email !== undefined) organisation.email = email;
    if (orgLogo !== undefined) organisation.orgLogo = orgLogo;
    if (defaultWorkingDays !== undefined) organisation.defaultWorkingDays = defaultWorkingDays;
    if (currency !== undefined) organisation.currency = currency;

    organisation.updatedBy = req.user.userId;
    await organisation.save();

    createAuditLog({
      orgId: organisation._id,
      action: 'UPDATE',
      module: 'Organisation',
      documentId: organisation._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(organisation),
      req,
    });

    return successResponse(res, 200, 'Organisation updated successfully', organisation);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Activate or suspend an organisation
 * @route   PATCH /api/v1/superadmin/organisations/:orgId/status
 * @access  Private (Super Admin)
 */
const updateOrganisationStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!['active', 'suspended'].includes(status)) {
      return errorResponse(res, 400, 'Status must be active or suspended');
    }

    const organisation = await Organisation.findById(req.params.orgId);
    if (!organisation) {
      return errorResponse(res, 404, 'Organisation not found');
    }

    const oldData = sanitizeForAudit(organisation);

    organisation.status = status;
    organisation.updatedBy = req.user.userId;
    await organisation.save();

    createAuditLog({
      orgId: organisation._id,
      action: 'STATUS_CHANGE',
      module: 'Organisation',
      documentId: organisation._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(organisation),
      req,
    });

    return successResponse(res, 200, `Organisation ${status === 'active' ? 'activated' : 'suspended'} successfully`, organisation);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Soft Delete organisation and all related data
 * @route   DELETE /api/v1/superadmin/organisations/:orgId
 * @access  Private (Super Admin)
 */
const deleteOrganisation = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const organisation = await Organisation.findById(req.params.orgId).session(session);
    if (!organisation) {
      await session.abortTransaction();
      session.endSession();
      return errorResponse(res, 404, 'Organisation not found');
    }

    const oldData = sanitizeForAudit(organisation);
    const now = new Date();
    const updatePayload = {
      isDeleted: true,
      deletedAt: now,
      deletedBy: req.user.userId
    };

    // Soft delete all related data for this org
    await Employee.updateMany({ orgId: organisation._id }, { $set: updatePayload }, { session });
    await Advance.updateMany({ orgId: organisation._id }, { $set: updatePayload }, { session });
    await Attendance.updateMany({ orgId: organisation._id }, { $set: updatePayload }, { session });
    await Salary.updateMany({ orgId: organisation._id }, { $set: updatePayload }, { session });
    await User.updateMany({ orgId: organisation._id, role: { $ne: 'superadmin' } }, { $set: updatePayload }, { session });

    // Soft delete the organisation itself
    organisation.isDeleted = true;
    organisation.deletedAt = now;
    organisation.deletedBy = req.user.userId;
    await organisation.save({ session });

    await session.commitTransaction();
    session.endSession();

    createAuditLog({
      orgId: organisation._id,
      action: 'SOFT_DELETE',
      module: 'Organisation',
      documentId: organisation._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(organisation),
      req,
    });

    return successResponse(res, 200, 'Organisation and all related data deleted successfully');
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    next(error);
  }
};

/**
 * @desc    Get admin details for an organisation
 * @route   GET /api/v1/superadmin/organisations/:orgId/admin
 * @access  Private (Super Admin)
 */
const getOrgAdmin = async (req, res, next) => {
  try {
    const organisation = await Organisation.findById(req.params.orgId);
    if (!organisation) {
      return errorResponse(res, 404, 'Organisation not found');
    }

    // Explicitly filter isDeleted for User
    const admin = await User.findOne({ orgId: organisation._id, role: 'admin', isDeleted: false })
      .select('-password')
      .lean();

    if (!admin) {
      return errorResponse(res, 404, 'Admin not found for this organisation');
    }

    return successResponse(res, 200, 'Admin details fetched', admin);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update admin details for an organisation
 * @route   PUT /api/v1/superadmin/organisations/:orgId/admin
 * @access  Private (Super Admin)
 */
const updateOrgAdmin = async (req, res, next) => {
  try {
    const { name, email } = req.body;

    const organisation = await Organisation.findById(req.params.orgId);
    if (!organisation) {
      return errorResponse(res, 404, 'Organisation not found');
    }

    const admin = await User.findOne({ orgId: organisation._id, role: 'admin', isDeleted: false });
    if (!admin) {
      return errorResponse(res, 404, 'Admin not found for this organisation');
    }

    const oldData = sanitizeForAudit(admin);

    // Check email uniqueness if email is being changed
    if (email && email !== admin.email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return errorResponse(res, 400, 'Email already in use');
      }
      admin.email = email;
    }

    if (name) admin.name = name;
    
    admin.updatedBy = req.user.userId;
    await admin.save();

    createAuditLog({
      orgId: organisation._id,
      action: 'UPDATE',
      module: 'User',
      documentId: admin._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      oldData,
      newData: sanitizeForAudit(admin),
      req,
    });

    return successResponse(res, 200, 'Admin updated successfully', {
      _id: admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset admin password for an organisation
 * @route   PATCH /api/v1/superadmin/organisations/:orgId/admin/reset-password
 * @access  Private (Super Admin)
 */
const resetAdminPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return errorResponse(res, 400, 'Password must be at least 8 characters');
    }

    const organisation = await Organisation.findById(req.params.orgId);
    if (!organisation) {
      return errorResponse(res, 404, 'Organisation not found');
    }

    const admin = await User.findOne({ orgId: organisation._id, role: 'admin', isDeleted: false });
    if (!admin) {
      return errorResponse(res, 404, 'Admin not found for this organisation');
    }

    admin.password = newPassword;
    admin.isFirstLogin = true;
    admin.updatedBy = req.user.userId;
    await admin.save(); // pre-save hook will hash the password

    createAuditLog({
      orgId: organisation._id,
      action: 'PASSWORD_RESET',
      module: 'User',
      documentId: admin._id,
      performedBy: req.user.userId,
      performedByName: req.user.name,
      req,
    });

    return successResponse(res, 200, 'Admin password reset successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Super Admin dashboard stats
 * @route   GET /api/v1/superadmin/dashboard
 * @access  Private (Super Admin)
 */
const getDashboard = async (req, res, next) => {
  try {
    const totalOrganisations = await Organisation.countDocuments();
    const activeOrganisations = await Organisation.countDocuments({ status: 'active' });
    const suspendedOrganisations = await Organisation.countDocuments({ status: 'suspended' });
    const totalAdmins = await User.countDocuments({ role: 'admin', isDeleted: false });
    const totalEmployeesAcrossAllOrgs = await Employee.countDocuments();

    // Plan breakdown - aggregate needs explicit isDeleted filter if we only want active orgs
    // but here we might want all non-deleted orgs which countDocuments already gives us,
    // so we must add isDeleted: false to aggregate.
    const planBreakdown = await Organisation.aggregate([
      { $match: { isDeleted: false } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);

    const planStats = { free: 0, pro: 0, enterprise: 0 };
    planBreakdown.forEach((p) => {
      planStats[p._id] = p.count;
    });

    // Recent organisations (last 5)
    const recentOrganisations = await Organisation.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return successResponse(res, 200, 'Dashboard data fetched successfully', {
      totalOrganisations,
      activeOrganisations,
      suspendedOrganisations,
      totalAdmins,
      totalEmployeesAcrossAllOrgs,
      planBreakdown: planStats,
      recentOrganisations,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllOrganisations,
  createOrganisation,
  getOrganisation,
  updateOrganisation,
  updateOrganisationStatus,
  deleteOrganisation,
  getOrgAdmin,
  updateOrgAdmin,
  resetAdminPassword,
  getDashboard,
};
