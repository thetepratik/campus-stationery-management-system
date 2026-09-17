import api from './api';

const toFormData = (data, files) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  if (files && files.length) {
    files.forEach((f) => fd.append('images', f));
  }
  return fd;
};

const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });
  return query.toString();
};

export const productApi = {
  list: (params) => api.get(`/products?${buildQueryString(params)}`),
  get: (id) => api.get(`/products/${id}`),
  create: (data, files) =>
    api.post('/products', toFormData(data, files), { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data, files) =>
    api.put(`/products/${id}`, toFormData(data, files), { headers: { 'Content-Type': 'multipart/form-data' } }),
  remove: (id) => api.delete(`/products/${id}`),
  bulkDelete: (productIds) => api.post('/products/bulk-delete', { productIds }),
  bulkUpdateStatus: (productIds, status) => api.post('/products/bulk-status', { productIds, status }),
  bulkPriceUpdate: (productIds, mode, value) => api.post('/products/bulk-price', { productIds, mode, value }),
  getBrands: () => api.get('/products/brands'),
};

