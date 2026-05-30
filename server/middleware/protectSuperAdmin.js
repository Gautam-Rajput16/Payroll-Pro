const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Protect Super Admin Routes
 * Verifies JWT token and ensures the user has superadmin role
 * Attaches user info to req.user for downstream controllers
 */
const protectSuperAdmin = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return errorResponse(res, 401, 'Not authorized, no token provided');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check role
    if (decoded.role !== 'superadmin') {
      return errorResponse(res, 403, 'Access denied. Super Admin only.');
    }

    // Fetch user from DB (exclude password)
    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    if (user.status !== 'active') {
      return errorResponse(res, 401, 'Account is deactivated');
    }

    // Attach user to request
    req.user = {
      userId: user._id,
      role: user.role,
      name: user.name,
      email: user.email,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return errorResponse(res, 401, 'Invalid token');
    }
    if (error.name === 'TokenExpiredError') {
      return errorResponse(res, 401, 'Token expired');
    }
    return errorResponse(res, 401, 'Not authorized');
  }
};

module.exports = protectSuperAdmin;
