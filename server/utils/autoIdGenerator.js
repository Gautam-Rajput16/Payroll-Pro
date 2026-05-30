const Counter = require('../models/Counter');

/**
 * Get the next sequential number for a given counter name
 * Uses atomic findOneAndUpdate with $inc for thread safety
 * @param {String} name - Counter name (e.g. 'employeeId', 'transactionId', 'orgId')
 * @returns {Number} Next sequential number
 */
async function getNextSequence(name) {
  const counter = await Counter.findOneAndUpdate(
    { name },
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return counter.seq;
}

/**
 * Generate the next Employee ID in format EMP001, EMP002, etc.
 * @returns {String} Formatted employee ID
 */
async function generateEmployeeId() {
  const seq = await getNextSequence('employeeId');
  return `EMP${String(seq).padStart(3, '0')}`;
}

/**
 * Generate the next Transaction (Advance) ID in format ADV001, ADV002, etc.
 * @returns {String} Formatted transaction ID
 */
async function generateTransactionId() {
  const seq = await getNextSequence('transactionId');
  return `ADV${String(seq).padStart(3, '0')}`;
}

/**
 * Generate the next Organisation ID in format ORG001, ORG002, etc.
 * @returns {String} Formatted organisation ID
 */
async function generateOrgId() {
  const seq = await getNextSequence('orgId');
  return `ORG${String(seq).padStart(3, '0')}`;
}

module.exports = {
  generateEmployeeId,
  generateTransactionId,
  generateOrgId,
};
