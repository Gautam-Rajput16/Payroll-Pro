const User = require('../../models/User');
const Organisation = require('../../models/Organisation');
const generateToken = require('../../utils/generateToken');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

/**
 * @desc    Employee Login
 * @route   POST /api/employee/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    // Find employee user (include password for comparison)
    const user = await User.findOne({ email, role: 'employee' }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Check if user account is active
    if (user.status !== 'active') {
      return errorResponse(res, 401, 'Account is deactivated. Contact your Admin.');
    }

    // Check if organisation is active
    const org = await Organisation.findById(user.orgId);
    if (!org) {
      return errorResponse(res, 404, 'Organisation not found');
    }

    if (org.status !== 'active') {
      return errorResponse(res, 403, 'Organisation is suspended. Contact your Admin.');
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Generate JWT token with orgId and employeeId
    const token = generateToken({
      userId: user._id,
      role: user.role,
      orgId: user.orgId,
      employeeId: user.employeeId,
    });

    return successResponse(res, 200, 'Login successful', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        employeeId: user.employeeId,
        isFirstLogin: user.isFirstLogin,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current employee user profile
 * @route   GET /api/employee/auth/me
 * @access  Private (Employee)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('employeeId', 'name employeeId designation phone')
      .populate('orgId', 'orgId orgName')
      .lean();

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Employee profile fetched', user);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Change employee password
 * @route   PATCH /api/employee/auth/change-password
 * @access  Private (Employee)
 */
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return errorResponse(res, 400, 'Please provide current and new password');
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'New password must be at least 6 characters');
    }

    // Get user with password
    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return errorResponse(res, 401, 'Current password is incorrect');
    }

    // Update password and set isFirstLogin to false
    user.password = newPassword;
    user.isFirstLogin = false;
    await user.save();

    return successResponse(res, 200, 'Password changed successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe, changePassword };
