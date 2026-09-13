import api from './api';

export const dashboardApi = {
  getFullDashboard: () => api.get('/admin/dashboard'),
  getSummary: () => api.get('/admin/dashboard/summary'),
  getSalesChart: (range = 30) => api.get(`/admin/dashboard/sales-chart?range=${range}`),
  getRevenueChart: (range = 30) => api.get(`/admin/dashboard/revenue-chart?range=${range}`),
};
