import api from './api';

const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });
  return query.toString();
};

export const inventoryApi = {
  getStockLevels: (params) => api.get(`/inventory/stock-levels?${buildQueryString(params)}`),
  getHistory: (params) => api.get(`/inventory/history?${buildQueryString(params)}`),
  getValueReport: () => api.get('/inventory/value-report'),
  restock: (productId, quantity, note) => api.post('/inventory/restock', { productId, quantity, note }),
  adjust: (productId, newStock, note) => api.post('/inventory/adjust', { productId, newStock, note }),
};
