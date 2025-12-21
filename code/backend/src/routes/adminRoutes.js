const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');

/**
 * Admin Routes
 * Protected routes for administrative operations
 */

// Import admin controller functions (to be implemented)
const {
    getAllUsers,
    getUserById,
    updateUserStatus,
    deleteUser,
    getAllLoans,
    getLoanById,
    updateLoanStatus,
    getSystemAnalytics,
    getSystemMetrics,
    exportAuditLogs,
} = require('../controllers/adminController');

// Apply authentication and authorization middleware to all routes
router.use(protect);
router.use(authorize('admin', 'super_admin'));

// User management routes
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);
router.delete('/users/:id', deleteUser);

// Loan management routes
router.get('/loans', getAllLoans);
router.get('/loans/:id', getLoanById);
router.put('/loans/:id/status', updateLoanStatus);

// Analytics and reporting routes
router.get('/analytics', getSystemAnalytics);
router.get('/metrics', getSystemMetrics);
router.post('/audit-logs/export', exportAuditLogs);

module.exports = router;
