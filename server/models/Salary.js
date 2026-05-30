const mongoose = require('mongoose');

/**
 * Salary Model
 * Stores calculated salary records for employees by month/year
 * Compound unique index ensures one salary record per employee per month per org
 * netSalary CAN be negative (employee owes money due to advances exceeding gross)
 *
 * Enterprise features:
 * - SNAPSHOT-BASED: All employee data is frozen at calculation time
 *   Even if employee salary/designation changes later, historical records stay accurate
 * - Soft delete (isDeleted) for data preservation
 * - createdBy/updatedBy for accountability
 * - Pre-query middleware auto-filters deleted records
 */
const salarySchema = new mongoose.Schema(
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
      min: 1,
      max: 12,
    },
    year: {
      type: Number,
      required: [true, 'Year is required'],
    },

    // ── Snapshot Fields (frozen at calculation time) ──
    employeeNameSnapshot: {
      type: String,
      default: '',
    },
    employeeCodeSnapshot: {
      type: String,
      default: '',
    },
    designationSnapshot: {
      type: String,
      default: '',
    },
    monthlySalarySnapshot: {
      type: Number,
    },
    workingDaysSnapshot: {
      type: Number,
    },

    // ── Calculated Fields ──
    presentDays: {
      type: Number,
    },
    perDaySalary: {
      type: Number,
    },
    grossSalary: {
      type: Number,
    },
    totalAdvances: {
      type: Number,
    },
    netSalary: {
      type: Number,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid'],
      default: 'Pending',
    },
    paidAt: {
      type: Date,
      default: null,
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
salarySchema.pre(/^find/, function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

salarySchema.pre('countDocuments', function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// ── Compound Indexes ──
salarySchema.index({ orgId: 1, employeeId: 1, month: 1, year: 1 }, { unique: true });
salarySchema.index({ orgId: 1, month: 1, year: 1, paymentStatus: 1 });
salarySchema.index({ orgId: 1, createdAt: -1 });

module.exports = mongoose.model('Salary', salarySchema);
