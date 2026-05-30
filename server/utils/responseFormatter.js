/**
 * Standard API response formatters
 * Ensures consistent JSON response structure across all endpoints
 */

/**
 * Send a standardized success response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code (default 200)
 * @param {String} message - Human-readable success message
 * @param {*} data - Response payload (object, array, etc.)
 * @param {Object} pagination - Optional pagination metadata
 */
function successResponse(res, statusCode = 200, message, data, pagination = null) {
  const response = {
    success: true,
    message,
    data,
  };

  if (pagination) {
    response.pagination = pagination;
  }

  return res.status(statusCode).json(response);
}

/**
 * Send a standardized error response
 * @param {Object} res - Express response object
 * @param {Number} statusCode - HTTP status code (default 500)
 * @param {String} message - Human-readable error message
 */
function errorResponse(res, statusCode = 500, message) {
  return res.status(statusCode).json({
    success: false,
    message,
  });
}

module.exports = { successResponse, errorResponse };
