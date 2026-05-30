/**
 * Global Error Handler Middleware
 * Catches all errors passed via next(error) and returns
 * a standardized JSON error response
 *
 * Handles specific error types:
 * - CastError: Invalid MongoDB ObjectId
 * - Duplicate key error (code 11000)
 * - Mongoose validation errors
 * - JWT errors (invalid/expired token)
 * - Custom errors with statusCode
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Log error in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error:', err);
  }

  // Handle MongoDB CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Handle MongoDB duplicate key error
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `Duplicate value for field: ${field}. This ${field} already exists.`;
  }

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    const messages = Object.values(err.errors).map((val) => val.message);
    message = messages.join('. ');
  }

  // Handle JWT invalid token
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please log in again.';
  }

  // Handle JWT expired token
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
