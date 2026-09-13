import api from './api';

const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });
  return query.toString();
};

export const saleApi = {
  list: (params) => api.get(`/sales?${buildQueryString(params)}`),
  get: (id) => api.get(`/sales/${id}`),
  create: (payload) => api.post('/sales', payload),
  invoiceUrl: (id) => `/api/sales/${id}/invoice`,
};
