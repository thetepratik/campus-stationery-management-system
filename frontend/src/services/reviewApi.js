import api from './api';

export const reviewApi = {
  listForProduct: (productId, params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/reviews/product/${productId}?${query}`);
  },
  create: (productId, rating, comment) => api.post('/reviews', { productId, rating, comment }),
  update: (id, rating, comment) => api.put(`/reviews/${id}`, { rating, comment }),
  remove: (id) => api.delete(`/reviews/${id}`),
};
