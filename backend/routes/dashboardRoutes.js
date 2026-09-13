const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.use(verifyToken, requireRole('admin'));

router.get('/', dashboardController.getDashboard);
router.get('/summary', dashboardController.getSummary);
router.get('/sales-chart', dashboardController.getSalesChart);
router.get('/revenue-chart', dashboardController.getRevenueChart);

module.exports = router;
