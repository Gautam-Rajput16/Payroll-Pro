const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * User Model
 * Handles all 3 roles: superadmin, admin, employee
 * Passwords are automatically hashed before save using bcrypt
 * Includes method to compare entered password against hash
 *
 * Enterprise features:
 * - Soft delete (isDeleted) for data preservation
 * - createdBy/updatedBy for accountability
 * - NOTE: No pre-query middleware here — User queries are filtered explicitly
 *   to avoid breaking auth flows (login, password reset)
 */
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      select: false, // Never return password in queries by default
    },
    role: {
      type: String,
      enum: ['superadmin', 'admin', 'employee'],
      required: [true, 'Role is required'],
    },
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      default: null, // null for superadmin
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
      default: null, // only populated for employee role
    },
    isFirstLogin: {
      type: Boolean,
      default: true, // Force password change on first login
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
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

// ── Compound Indexes ──
userSchema.index({ orgId: 1, role: 1, isDeleted: 1 });
userSchema.index({ employeeId: 1, role: 1 });
userSchema.index({ role: 1, isDeleted: 1 });

/**
 * Pre-save hook to hash the password using bcrypt
 * Only runs if the password field has been modified
 */
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

/**
 * Instance method to compare an entered password with the stored hash
 * @param {String} enteredPassword - Plain text password to compare
 * @returns {Boolean} Whether the password matches
 */
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
