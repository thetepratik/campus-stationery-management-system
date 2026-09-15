import api from './api';

export const orderApi = {
  checkoutRazorpay: (pickupTime) => api.post('/orders/checkout/razorpay', { pickupTime, paymentMethod: 'razorpay' }),
  get: (id) => api.get(`/orders/${id}`),
  list: () => api.get('/orders'),
};
