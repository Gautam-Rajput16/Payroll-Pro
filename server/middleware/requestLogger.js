const morgan = require('morgan');

/**
 * Request Logger Middleware
 * Uses Morgan for HTTP request logging
 * Only active in development mode
 */
const requestLogger = morgan('dev');

module.exports = requestLogger;
