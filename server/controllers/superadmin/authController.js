const User = require('../../models/User');
const generateToken = require('../../utils/generateToken');
const { successResponse, errorResponse } = require('../../utils/responseFormatter');

/**
 * @desc    Super Admin Login
 * @route   POST /api/superadmin/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return errorResponse(res, 400, 'Please provide email and password');
    }

    // Find superadmin user (include password for comparison)
    const user = await User.findOne({ email, role: 'superadmin' }).select('+password');

    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Check if account is active
    if (user.status !== 'active') {
      return errorResponse(res, 401, 'Account is deactivated');
    }

    // Compare password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password');
    }

    // Generate JWT token
    const token = generateToken({
      userId: user._id,
      role: user.role,
    });

    return successResponse(res, 200, 'Login successful', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current Super Admin profile
 * @route   GET /api/superadmin/auth/me
 * @access  Private (Super Admin)
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId).lean();

    if (!user) {
      return errorResponse(res, 404, 'User not found');
    }

    return successResponse(res, 200, 'Super Admin profile fetched', {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login, getMe };
