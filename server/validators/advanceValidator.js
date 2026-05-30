const { body, validationResult } = require('express-validator');

/**
 * Validation rules for advance payment creation
 */
const advanceValidationRules = () => [
  body('employeeId')
    .notEmpty()
    .withMessage('Employee ID is required')
    .isMongoId()
    .withMessage('Invalid Employee ID format'),

  body('amount')
    .notEmpty()
    .withMessage('Amount is required')
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),

  body('date')
    .notEmpty()
    .withMessage('Date is required')
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const advanceDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (advanceDate > today) {
        throw new Error('Advance date cannot be a future date');
      }
      return true;
    }),

  body('paymentMode')
    .notEmpty()
    .withMessage('Payment mode is required')
    .isIn(['Cash', 'UPI', 'Bank Transfer'])
    .withMessage('Payment mode must be Cash, UPI, or Bank Transfer'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

/**
 * Validation rules for advance payment update
 */
const advanceUpdateValidationRules = () => [
  body('amount')
    .optional()
    .isNumeric()
    .withMessage('Amount must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    }),

  body('date')
    .optional()
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const advanceDate = new Date(value);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      if (advanceDate > today) {
        throw new Error('Advance date cannot be a future date');
      }
      return true;
    }),

  body('paymentMode')
    .optional()
    .isIn(['Cash', 'UPI', 'Bank Transfer'])
    .withMessage('Payment mode must be Cash, UPI, or Bank Transfer'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Reason cannot exceed 500 characters'),
];

/**
 * Middleware to check validation results
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map((err) => err.msg);
    return res.status(400).json({
      success: false,
      message: messages.join('. '),
    });
  }
  next();
};

module.exports = {
  advanceValidationRules,
  advanceUpdateValidationRules,
  validate,
};
