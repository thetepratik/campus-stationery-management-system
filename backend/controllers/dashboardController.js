const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const dashboardService = require('../services/dashboardService');

const getDashboard = asyncHandler(async (req, res) => {
  const data = await dashboardService.getFullDashboard();
  success(res, 200, 'Dashboard data fetched', data);
});

const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary();
  success(res, 200, 'Summary fetched', data);
});

const getSalesChart = asyncHandler(async (req, res) => {
  const range = Number(req.query.range) || 30;
  const data = await dashboardService.getSalesChart(range);
  success(res, 200, 'Sales chart fetched', data);
});

const getRevenueChart = asyncHandler(async (req, res) => {
  const range = Number(req.query.range) || 30;
  const data = await dashboardService.getRevenueChart(range);
  success(res, 200, 'Revenue chart fetched', data);
});

module.exports = { getDashboard, getSummary, getSalesChart, getRevenueChart };
