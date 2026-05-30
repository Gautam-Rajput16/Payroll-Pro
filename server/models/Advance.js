const mongoose = require('mongoose');

/**
 * Advance Payment Model
 * Tracks advance payments given to employees
 * transactionId is auto-generated in format ADV001, ADV002, etc.
 *
 * Enterprise features:
 * - Soft delete (isDeleted) for data preservation
 * - createdBy/updatedBy for accountability
 * - Pre-query middleware auto-filters deleted records
 */
const advanceSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      required: [true, 'Organisation ID is required'],
    },
    transactionId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      required: [true, 'Employee ID is required'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      validate: {
        validator: function (v) {
          const today = new Date();
          today.setHours(23, 59, 59, 999);
          return v <= today;
        },
        message: 'Advance date cannot be a future date',
      },
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [1, 'Amount must be greater than 0'],
    },
    paymentMode: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer'],
      required: [true, 'Payment mode is required'],
    },
    reason: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Paid', 'Deducted'],
      default: 'Pending',
    },
    notes: {
      type: String,
      default: '',
      trim: true,
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
advanceSchema.pre(/^find/, function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

advanceSchema.pre('countDocuments', function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// ── Compound Indexes ──
advanceSchema.index({ orgId: 1, isDeleted: 1, employeeId: 1, date: -1 });
advanceSchema.index({ orgId: 1, isDeleted: 1, date: -1 });
advanceSchema.index({ orgId: 1, isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Advance', advanceSchema);
