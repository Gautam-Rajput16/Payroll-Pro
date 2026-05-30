const mongoose = require('mongoose');

/**
 * Counter Model
 * Used for auto-incrementing sequential IDs (EMP001, ADV001, ORG001)
 * Each counter document tracks the current sequence number for a given name
 */
const counterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  seq: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Counter', counterSchema);
