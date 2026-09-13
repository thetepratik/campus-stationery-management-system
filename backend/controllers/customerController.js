const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');
const customerService = require('../services/customerService');

/**
 * GET /api/customers/summary
 * Retrieve top summary cards metrics:
 * Total Customers, Active Customers, New This Month, Total Orders, Total Spent
 */
const getCustomerSummary = asyncHandler(async (req, res) => {
  const summary = await customerService.getGlobalCustomerSummary();
  success(res, 200, 'Customer summary retrieved successfully', summary);
});

/**
 * GET /api/customers
 * Paginated customers list with search, department, status, date filtering, and sorting
 */
const getCustomers = asyncHandler(async (req, res) => {
  const result = await customerService.getCustomers(req.query);
  success(
    res,
    200,
    'Customers fetched successfully',
    {
      customers: result.customers,
      departments: result.departments,
    },
    result.pagination
  );
});

/**
 * GET /api/customers/:id
 * Retrieve customer profile by ID
 */
const getCustomerDetails = asyncHandler(async (req, res) => {
  const customer = await customerService.getCustomerById(req.params.id);
  success(res, 200, 'Customer details fetched successfully', { customer });
});

/**
 * GET /api/customers/:id/purchases
 * Retrieve customer purchase history (combining online orders and offline sales)
 */
const getCustomerPurchases = asyncHandler(async (req, res) => {
  const result = await customerService.getCustomerPurchases(req.params.id, req.query);
  success(
    res,
    200,
    'Customer purchases fetched successfully',
    {
      purchases: result.purchases,
      counts: result.counts,
    },
    result.pagination
  );
});

/**
 * GET /api/customers/:id/statistics
 * Retrieve customer purchase analytics (orders, items, spent, AOV, top products, monthly spending)
 */
const getCustomerAnalytics = asyncHandler(async (req, res) => {
  const stats = await customerService.getCustomerStatistics(req.params.id);
  success(res, 200, 'Customer analytics fetched successfully', stats);
});

/**
 * PATCH /api/customers/:id/status
 * Update customer status (active, inactive, blocked)
 */
const updateCustomerStatus = asyncHandler(async (req, res) => {
  const { status, reason } = req.body;
  const updatedCustomer = await customerService.updateCustomerStatus(
    req.params.id,
    { status, reason },
    req.user
  );
  success(res, 200, `Customer status updated to ${status}`, { customer: updatedCustomer });
});

module.exports = {
  getCustomerSummary,
  getCustomers,
  getCustomerDetails,
  getCustomerPurchases,
  getCustomerAnalytics,
  updateCustomerStatus,
};
