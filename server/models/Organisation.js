const mongoose = require('mongoose');

/**
 * Organisation / Tenant Model
 * Each organisation is an isolated tenant in the SaaS system
 * orgId is auto-generated in format ORG001, ORG002, etc.
 *
 * Enterprise features:
 * - Soft delete (isDeleted) for data preservation
 * - createdBy/updatedBy for accountability
 * - Pre-query middleware auto-filters deleted records
 */
const organisationSchema = new mongoose.Schema(
  {
    orgId: {
      type: String,
      unique: true,
      required: true,
      trim: true,
    },
    orgName: {
      type: String,
      required: [true, 'Organisation name is required'],
      trim: true,
    },
    orgLogo: {
      type: String,
      default: '',
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    email: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    plan: {
      type: String,
      enum: ['free', 'pro', 'enterprise'],
      default: 'free',
    },
    status: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    defaultWorkingDays: {
      type: Number,
      default: 26,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    createdBySuperAdmin: {
      type: Boolean,
      default: true,
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
organisationSchema.pre(/^find/, function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

organisationSchema.pre('countDocuments', function (next) {
  if (this.getQuery().isDeleted === undefined) {
    this.where({ isDeleted: false });
  }
  next();
});

// ── Compound Indexes ──
organisationSchema.index({ status: 1, plan: 1 });
organisationSchema.index({ isDeleted: 1, status: 1 });
organisationSchema.index({ isDeleted: 1, createdAt: -1 });

module.exports = mongoose.model('Organisation', organisationSchema);
