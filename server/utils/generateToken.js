const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token with the given payload
 * Uses JWT_SECRET and JWT_EXPIRE from environment variables
 * @param {Object} payload - Data to encode in the token
 * @returns {String} Signed JWT token
 */
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = generateToken;
