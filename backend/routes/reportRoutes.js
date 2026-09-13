const express = require('express');
const router = express.Router();

const reportController = require('../controllers/reportController');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');
const validate = require('../middlewares/validateMiddleware');
const { salesReportQueryValidation } = require('../validations/reportValidation');

// Admin-only report endpoints
router.use(verifyToken, requireRole('admin'));

router.get('/sales', salesReportQueryValidation, validate, reportController.getSalesReport);
router.get('/sales/export/pdf', salesReportQueryValidation, validate, reportController.exportSalesPdf);
router.get('/sales/export/excel', salesReportQueryValidation, validate, reportController.exportSalesExcel);

module.exports = router;
