const { body, validationResult } = require('express-validator');

/**
 * Validation rules for organisation creation (with admin)
 */
const organisationValidationRules = () => [
  body('orgName')
    .trim()
    .notEmpty()
    .withMessage('Organisation name is required')
    .isLength({ min: 2 })
    .withMessage('Organisation name must be at least 2 characters'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),

  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),

  body('plan')
    .optional()
    .isIn(['free', 'pro', 'enterprise'])
    .withMessage('Plan must be free, pro, or enterprise'),

  body('adminName')
    .trim()
    .notEmpty()
    .withMessage('Admin name is required')
    .isLength({ min: 2 })
    .withMessage('Admin name must be at least 2 characters'),

  body('adminEmail')
    .trim()
    .notEmpty()
    .withMessage('Admin email is required')
    .isEmail()
    .withMessage('Invalid admin email format'),

  body('adminPassword')
    .notEmpty()
    .withMessage('Admin password is required')
    .isLength({ min: 8 })
    .withMessage('Admin password must be at least 8 characters'),
];

/**
 * Validation rules for organisation update (no admin fields)
 */
const organisationUpdateValidationRules = () => [
  body('orgName')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Organisation name cannot be empty')
    .isLength({ min: 2 })
    .withMessage('Organisation name must be at least 2 characters'),

  body('phone')
    .optional({ values: 'falsy' })
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Phone number must be exactly 10 digits'),

  body('email')
    .optional({ values: 'falsy' })
    .trim()
    .isEmail()
    .withMessage('Invalid email format'),

  body('plan')
    .optional()
    .isIn(['free', 'pro', 'enterprise'])
    .withMessage('Plan must be free, pro, or enterprise'),
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
  organisationValidationRules,
  organisationUpdateValidationRules,
  validate,
};
