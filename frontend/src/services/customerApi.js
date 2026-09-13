import api from './api';

export const customerApi = {
  /**
   * Get paginated customers with search, department, status, date filtering, and sorting
   */
  getCustomers: async (params = {}) => {
    return api.get('/customers', { params });
  },

  /**
   * Get top summary card metrics (Total, Active, New, Orders, Spent)
   */
  getCustomerSummary: async () => {
    return api.get('/customers/summary');
  },

  /**
   * Get single customer details by student ID
   */
  getCustomerById: async (id) => {
    return api.get(`/customers/${id}`);
  },

  /**
   * Get unified customer purchase history (online orders + offline sales)
   */
  getCustomerPurchases: async (id, params = {}) => {
    return api.get(`/customers/${id}/purchases`, { params });
  },

  /**
   * Get customer purchase analytics (top products, monthly spending, order counts)
   */
  getCustomerStatistics: async (id) => {
    return api.get(`/customers/${id}/statistics`);
  },

  /**
   * Update customer status (active, inactive, blocked) with optional reason
   */
  updateCustomerStatus: async (id, status, reason = '') => {
    return api.patch(`/customers/${id}/status`, { status, reason });
  },
};

export default customerApi;
