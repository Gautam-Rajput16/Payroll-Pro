const AuditLog = require('../models/AuditLog');

/**
 * Create an audit log entry
 * Non-blocking — audit failures do not break the main flow
 *
 * @param {Object} params
 * @param {ObjectId} params.orgId - Organisation ID (null for superadmin actions)
 * @param {String} params.action - Action type (CREATE, UPDATE, DELETE, etc.)
 * @param {String} params.module - Module name (Employee, Advance, etc.)
 * @param {ObjectId} params.documentId - ID of the affected document
 * @param {ObjectId} params.performedBy - User ID who performed the action
 * @param {String} params.performedByName - Cached name for display
 * @param {Object} params.oldData - Data before the change
 * @param {Object} params.newData - Data after the change
 * @param {Object} params.req - Express request object (for IP and user-agent)
 */
const createAuditLog = async ({
  orgId = null,
  action,
  module: moduleName,
  documentId = null,
  performedBy,
  performedByName = '',
  oldData = null,
  newData = null,
  req = null,
}) => {
  try {
    const logEntry = {
      orgId,
      action,
      module: moduleName,
      documentId,
      performedBy,
      performedByName,
      oldData,
      newData,
      ipAddress: req ? (req.ip || req.connection?.remoteAddress || '') : '',
      userAgent: req ? (req.headers?.['user-agent'] || '') : '',
    };

    // Non-blocking: fire and forget to avoid slowing down the main request
    AuditLog.create(logEntry).catch((err) => {
      console.error('Audit Log Error:', err.message);
    });
  } catch (error) {
    // Never let audit logging break the main flow
    console.error('Audit Log Error:', error.message);
  }
};

/**
 * Sanitize a Mongoose document for audit storage
 * Removes sensitive fields and converts to plain object
 *
 * @param {Object} doc - Mongoose document or plain object
 * @param {Array} excludeFields - Fields to exclude from the snapshot
 * @returns {Object} Sanitized plain object
 */
const sanitizeForAudit = (doc, excludeFields = ['password', '__v']) => {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  excludeFields.forEach((field) => delete obj[field]);
  return obj;
};

module.exports = { createAuditLog, sanitizeForAudit };
