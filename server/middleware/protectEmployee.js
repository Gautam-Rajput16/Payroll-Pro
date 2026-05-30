const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Organisation = require('../models/Organisation');
const { errorResponse } = require('../utils/responseFormatter');

/**
 * Protect Employee Routes
 * Verifies JWT token, ensures employee role, checks user and org are active
 * Attaches user info including orgId and employeeId to req.user
 */
const protectEmployee = async (req, res, next) => {
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
    if (decoded.role !== 'employee') {
      return errorResponse(res, 403, 'Access denied. Employee only.');
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
      return errorResponse(res, 403, 'Organisation is suspended. Contact your Admin.');
    }

    // Attach user info with orgId and employeeId for isolation
    req.user = {
      userId: user._id,
      role: user.role,
      orgId: user.orgId,
      employeeId: user.employeeId,
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

module.exports = protectEmployee;
