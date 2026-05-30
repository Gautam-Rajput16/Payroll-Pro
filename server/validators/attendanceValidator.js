const { body, validationResult } = require('express-validator');

/**
 * Validation rules for bulk attendance submission
 */
const attendanceBulkValidationRules = () => [
  body('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be a valid 4-digit year'),

  body('records')
    .isArray({ min: 1 })
    .withMessage('Records must be a non-empty array'),

  body('records.*.employeeId')
    .notEmpty()
    .withMessage('Employee ID is required for each record')
    .isMongoId()
    .withMessage('Invalid Employee ID format'),

  body('records.*.workingDays')
    .notEmpty()
    .withMessage('Working days is required for each record')
    .isInt({ min: 1 })
    .withMessage('Working days must be greater than 0'),

  body('records.*.presentDays')
    .notEmpty()
    .withMessage('Present days is required for each record')
    .isInt({ min: 0 })
    .withMessage('Present days cannot be negative'),

  // Custom validation: presentDays <= workingDays
  body('records').custom((records, { req }) => {
    for (const record of records) {
      if (parseInt(record.presentDays) > parseInt(record.workingDays)) {
        throw new Error(
          `Present days (${record.presentDays}) cannot exceed working days (${record.workingDays}) for employee ${record.employeeId}`
        );
      }
    }
    return true;
  }),
];

/**
 * Validation rules for single attendance update
 */
const attendanceUpdateValidationRules = () => [
  body('presentDays')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Present days cannot be negative'),

  body('workingDays')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Working days must be greater than 0'),
];

/**
 * Validation rules for attendance finalization
 */
const attendanceFinalizeValidationRules = () => [
  body('month')
    .notEmpty()
    .withMessage('Month is required')
    .isInt({ min: 1, max: 12 })
    .withMessage('Month must be between 1 and 12'),

  body('year')
    .notEmpty()
    .withMessage('Year is required')
    .isInt({ min: 2000, max: 2100 })
    .withMessage('Year must be a valid 4-digit year'),
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
  attendanceBulkValidationRules,
  attendanceUpdateValidationRules,
  attendanceFinalizeValidationRules,
  validate,
};
