const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const connectDB = require('./config/db');
const requestLogger = require('./middleware/requestLogger');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// ─────────────────────────────────────────────
// SECURITY MIDDLEWARE
// ─────────────────────────────────────────────

// Helmet for security headers
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true,
  })
);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logger (development only)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// ─────────────────────────────────────────────
// PER-ROLE RATE LIMITING
// ─────────────────────────────────────────────

// Auth routes — strongest (prevents brute force login attacks)
const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Increased to avoid 429 during dev with React StrictMode
  message: {
    success: false,
    message: 'Too many login attempts. Please try again after 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Super Admin routes — stricter (sensitive operations)
const superadminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Admin routes — moderate
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests. Please slow down.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Employee routes — lighter (mostly read operations)
const employeeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  message: {
    success: false,
    message: 'Too many requests. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// ─────────────────────────────────────────────
// HEALTH CHECK (version-independent)
// ─────────────────────────────────────────────

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    data: {
      status: 'OK',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      apiVersion: 'v1',
    },
  });
});

// ─────────────────────────────────────────────
// ROUTE IMPORTS
// ─────────────────────────────────────────────

// Super Admin Routes
const superadminAuthRoutes = require('./routes/superadmin/authRoutes');
const superadminOrgRoutes = require('./routes/superadmin/organisationRoutes');

// Admin Routes
const adminAuthRoutes = require('./routes/admin/authRoutes');
const adminEmployeeRoutes = require('./routes/admin/employeeRoutes');
const adminAdvanceRoutes = require('./routes/admin/advanceRoutes');
const adminAttendanceRoutes = require('./routes/admin/attendanceRoutes');
const adminSalaryRoutes = require('./routes/admin/salaryRoutes');
const adminReportRoutes = require('./routes/admin/reportRoutes');
const adminDashboardRoutes = require('./routes/admin/dashboardRoutes');

// Employee Routes
const employeeAuthRoutes = require('./routes/employee/authRoutes');
const employeePortalRoutes = require('./routes/employee/portalRoutes');

// ─────────────────────────────────────────────
// MOUNT ROUTES (API v1)
// ─────────────────────────────────────────────

// Super Admin (auth has strongest rate limit, other routes have stricter limit)
app.use('/api/v1/superadmin/auth', authRateLimiter, superadminAuthRoutes);
app.use('/api/v1/superadmin', superadminLimiter, superadminOrgRoutes);

// Admin (auth has strongest rate limit, other routes have moderate limit)
app.use('/api/v1/admin/auth', authRateLimiter, adminAuthRoutes);
app.use('/api/v1/admin/employees', adminLimiter, adminEmployeeRoutes);
app.use('/api/v1/admin/advances', adminLimiter, adminAdvanceRoutes);
app.use('/api/v1/admin/attendance', adminLimiter, adminAttendanceRoutes);
app.use('/api/v1/admin/salary', adminLimiter, adminSalaryRoutes);
app.use('/api/v1/admin/reports', adminLimiter, adminReportRoutes);
app.use('/api/v1/admin/dashboard', adminLimiter, adminDashboardRoutes);

// Employee (auth has strongest rate limit, portal has lighter limit)
app.use('/api/v1/employee/auth', authRateLimiter, employeeAuthRoutes);
app.use('/api/v1/employee/portal', employeeLimiter, employeePortalRoutes);

// ─────────────────────────────────────────────
// 404 HANDLER
// ─────────────────────────────────────────────

app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ─────────────────────────────────────────────
// GLOBAL ERROR HANDLER (must be last middleware)
// ─────────────────────────────────────────────

app.use(errorHandler);

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📦 API Base: http://localhost:${PORT}/api/v1`);
  console.log(`🔗 Client URL: ${process.env.CLIENT_URL}\n`);
});

module.exports = app;
