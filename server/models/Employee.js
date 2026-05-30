const mongoose = require('mongoose');

/**
 * Employee Master Data Model
 * Contains all employee information, linked to an organisation via orgId
 * employeeId is auto-generated in format EMP001, EMP002, etc.
 *
 * Enterprise features:
 * - Soft delete (isDeleted) for data preservation
 * - createdBy/updatedBy for accountability
 * - Pre-query middleware auto-filters deleted records
 */
const employeeSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
    },
    employeeId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Employee name is required'],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      validate: {
        validator: function (v) {
          return /^\d{10}$/.test(v);
        },
        message: 'Phone number must be exactly 10 digits',
      },
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    designation: {
      type: String,
      default: '',
      trim: true,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    monthlySalary: {
      type: Number,
      required: [true, 'Monthly salary is required'],
      min: [1, 'Salary must be greater than 0'],
    },
    bankName: {
      type: String,
      default: '',
      trim: true,
    },
    accountNumber: {
      type: String,
      default: '',
      trim: true,
    },
    ifscCode: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
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
employeeSchema.pre(/^find/, function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

employeeSchema.pre('countDocuments', function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// ── Compound Indexes for multi-tenancy + performance ──
employeeSchema.index({ orgId: 1, isDeleted: 1, status: 1 });
employeeSchema.index({ orgId: 1, isDeleted: 1, name: 1 });
employeeSchema.index({ orgId: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Employee', employeeSchema);
