const mongoose = require('mongoose');

/**
 * Attendance Model
 * Tracks monthly attendance for each employee
 * Compound unique index ensures one record per employee per month per org
 *
 * Enterprise features:
 * - Soft delete (isDeleted) for data preservation
 * - createdBy/updatedBy for accountability
 * - Pre-query middleware auto-filters deleted records
 */
const attendanceSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
    month: {
      type: Number,
      required: [true, 'Month is required'],
      min: [1, 'Month must be between 1 and 12'],
      max: [12, 'Month must be between 1 and 12'],
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },
    presentDays: {
      type: Number,
      required: [true, 'Present days is required'],
      min: [0, 'Present days cannot be negative'],
    },
    workingDays: {
      type: Number,
      default: 26,
    },
    status: {
      type: String,
      enum: ['Draft', 'Finalized'],
      default: 'Draft',
    },

    // ── Soft Delete ──
    isDeleted: {
      type: Boolean,
      default: false,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ── Accountability ──
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// ── Pre-query middleware: auto-filter soft-deleted records ──
attendanceSchema.pre(/^find/, function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

attendanceSchema.pre('countDocuments', function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// Pre-save validation: presentDays cannot exceed workingDays
attendanceSchema.pre('save', function (next) {
  if (this.presentDays > this.workingDays) {
    const err = new Error('Present days cannot exceed working days');
    err.statusCode = 400;
    return next(err);
  }
  next();
});

// ── Compound Indexes ──
attendanceSchema.index(
  { orgId: 1, employeeId: 1, month: 1, year: 1, isDeleted: 1 },
  { unique: true }
);
attendanceSchema.index({ orgId: 1, isDeleted: 1, month: 1, year: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
