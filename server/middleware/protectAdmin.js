const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organisation = require('../models/Organisation');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Protect Admin Routes
 * Verifies JWT token, ensures admin role, checks org is active
 * Attaches user info including orgId to req.user for tenant isolation
 */
const protectAdmin = async (req, res, next) => {
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
    if (decoded.role !== 'admin') {
      return errorResponse(res, 403, 'Access denied. Admin only.');
    }

    // Fetch user from DB to confirm active status
    const user = await User.findById(decoded.userId);
    if (!user) {
      return errorResponse(res, 401, 'User not found');
    }

    if (user.status !== 'active') {
      return errorResponse(res, 401, 'Account is deactivated');
    }

    // Fetch organisation to confirm it's active
    const org = await Organisation.findById(user.orgId);
    if (!org) {
      return errorResponse(res, 404, 'Organisation not found');
    }

    if (org.status !== 'active') {
      return errorResponse(res, 403, 'Organisation is suspended. Contact Super Admin.');
    }

    // Attach user info with orgId for tenant isolation
    req.user = {
      userId: user._id,
      role: user.role,
      orgId: user.orgId,
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

module.exports = protectAdmin;
