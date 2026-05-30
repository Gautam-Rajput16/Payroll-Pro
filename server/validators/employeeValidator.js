const { body, validationResult } = require('express-validator');

/**
 * Validation rules for employee creation and update
 */
const employeeValidationRules = () => [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),

  body('phone')
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),

  body('monthlySalary')
    .notEmpty()
    .withMessage('Monthly salary is required')
    .isNumeric()
    .withMessage('Monthly salary must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Salary must be greater than 0');
      }
      return true;
    }),

  body('joiningDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Invalid date format')
    .custom((value) => {
      const joinDate = new Date(value);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      if (joinDate >= tomorrow) {
        throw new Error('Joining date cannot be a future date');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive'),

  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
];

/**
 * Validation rules for employee update (less strict - all optional)
 */
const employeeUpdateValidationRules = () => [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('Name must be at least 2 characters'),

  body('phone')
    .optional()
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),

  body('monthlySalary')
    .optional()
    .isNumeric()
    .withMessage('Monthly salary must be a number')
    .custom((value) => {
      if (parseFloat(value) <= 0) {
        throw new Error('Salary must be greater than 0');
      }
      return true;
    }),

  body('joiningDate')
    .optional({ values: 'falsy' })
    .isISO8601()
    .withMessage('Invalid date format'),

  body('status')
    .optional()
    .isIn(['Active', 'Inactive'])
    .withMessage('Status must be Active or Inactive'),

  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),
];

/**
 * Middleware to check validation results and return errors if any
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
  employeeValidationRules,
  employeeUpdateValidationRules,
  validate,
};
