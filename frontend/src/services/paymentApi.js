import api from './api';

export const paymentApi = {
  verify: (payload) => api.post('/payments/verify', payload),
};
