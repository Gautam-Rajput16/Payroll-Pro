const mongoose = require('mongoose');

/**
 * Audit Log Model
 * Immutable log of every mutation in the system
 * Tracks who changed what, when, with old/new values
 * Critical for payroll compliance and accountability
 */
const auditLogSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organisation',
      default: null, // null for superadmin-level actions
    },
    action: {
      type: String,
      required: true,
      enum: [
        'CREATE',
        'UPDATE',
        'DELETE',
        'SOFT_DELETE',
        'RESTORE',
        'STATUS_CHANGE',
        'CALCULATE',
        'PASSWORD_RESET',
        'PASSWORD_CHANGE',
        'LOGIN',
        'FINALIZE',
      ],
    },
    module: {
      type: String,
      required: true,
      enum: [
        'Organisation',
        'User',
        'Employee',
        'Advance',
        'Attendance',
        'Salary',
        'Auth',
      ],
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    performedByName: {
      type: String,
      default: '',
    },
    oldData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    newData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false }, // Logs are immutable
  }
);

// Indexes for efficient querying
auditLogSchema.index({ orgId: 1, module: 1 });
auditLogSchema.index({ orgId: 1, createdAt: -1 });
auditLogSchema.index({ orgId: 1, documentId: 1 });
auditLogSchema.index({ performedBy: 1, createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
