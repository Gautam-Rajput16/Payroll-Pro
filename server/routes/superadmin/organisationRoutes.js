const express = require('express');
const router = express.Router();
const protectSuperAdmin = require('../../middleware/protectSuperAdmin');
const {
  getAllOrganisations,
  createOrganisation,
  getOrganisation,
  updateOrganisation,
  updateOrganisationStatus,
  deleteOrganisation,
  getOrgAdmin,
  updateOrgAdmin,
  resetAdminPassword,
  getDashboard,
} = require('../../controllers/superadmin/organisationController');
const {
  organisationValidationRules,
  organisationUpdateValidationRules,
  validate,
} = require('../../validators/organisationValidator');

// All routes require superadmin auth
router.use(protectSuperAdmin);

// GET /api/superadmin/dashboard - Dashboard stats
router.get('/dashboard', getDashboard);

// GET /api/superadmin/organisations - List all organisations
router.get('/organisations', getAllOrganisations);

// POST /api/superadmin/organisations - Create org + admin
router.post('/organisations', organisationValidationRules(), validate, createOrganisation);

// GET /api/superadmin/organisations/:orgId - Get single org details
router.get('/organisations/:orgId', getOrganisation);

// PUT /api/superadmin/organisations/:orgId - Update org
router.put('/organisations/:orgId', organisationUpdateValidationRules(), validate, updateOrganisation);

// PATCH /api/superadmin/organisations/:orgId/status - Activate/Suspend org
router.patch('/organisations/:orgId/status', updateOrganisationStatus);

// DELETE /api/superadmin/organisations/:orgId - Delete org + all data
router.delete('/organisations/:orgId', deleteOrganisation);

// GET /api/superadmin/organisations/:orgId/admin - Get admin details
router.get('/organisations/:orgId/admin', getOrgAdmin);

// PUT /api/superadmin/organisations/:orgId/admin - Update admin details
router.put('/organisations/:orgId/admin', updateOrgAdmin);

// PATCH /api/superadmin/organisations/:orgId/admin/reset-password - Reset admin password
router.patch('/organisations/:orgId/admin/reset-password', resetAdminPassword);

module.exports = router;
