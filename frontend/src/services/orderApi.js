import api from './api';

export const orderApi = {
  checkoutCash: (pickupTime) => api.post('/orders/checkout', { pickupTime, paymentMethod: 'cash-on-pickup' }),
  checkoutRazorpay: (pickupTime) => api.post('/orders/checkout/razorpay', { pickupTime, paymentMethod: 'razorpay' }),
  get: (id) => api.get(`/orders/${id}`),
  list: () => api.get('/orders'),
};
