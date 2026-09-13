const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const reportService = require('../services/reportService');

/**
 * GET /api/reports/sales
 * Generates aggregated sales report metrics, trends, breakdowns, and transactions.
 */
const getSalesReport = asyncHandler(async (req, res) => {
  const reportData = await reportService.getSalesReportData(req.query);

  const { meta, allTransactions, ...data } = reportData;

  return success(res, 200, 'Sales report generated successfully', data, meta);
});

/**
 * GET /api/reports/sales/export/pdf
 * Streams a styled PDF sales report.
 */
const exportSalesPdf = asyncHandler(async (req, res) => {
  const reportData = await reportService.getSalesReportData(req.query);
  await reportService.generatePdfReport(reportData, res);
});

/**
 * GET /api/reports/sales/export/excel
 * Streams a styled Excel (.xlsx) workbook sales report.
 */
const exportSalesExcel = asyncHandler(async (req, res) => {
  const reportData = await reportService.getSalesReportData(req.query);
  await reportService.generateExcelReport(reportData, res);
});

module.exports = {
  getSalesReport,
  exportSalesPdf,
  exportSalesExcel,
};
