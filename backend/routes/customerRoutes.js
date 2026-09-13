const express = require('express');
const router = express.Router();

const customerController = require('../controllers/customerController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Protect all customer routes with admin role authorization
router.use(verifyToken, requireRole('admin'));

// Global summary for top metric cards
router.get('/summary', customerController.getCustomerSummary);

// Paginated customers list
router.get('/', customerController.getCustomers);

// Single customer details
router.get('/:id', customerController.getCustomerDetails);

// Customer purchase history (online + offline)
router.get('/:id/purchases', customerController.getCustomerPurchases);

// Customer purchase analytics & monthly trends
router.get('/:id/statistics', customerController.getCustomerAnalytics);

// Customer status update (block / unblock / active)
router.patch('/:id/status', customerController.updateCustomerStatus);

module.exports = router;
