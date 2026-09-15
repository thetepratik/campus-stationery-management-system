import api from './api';
import { triggerBlobDownload } from '../utils/downloadPdf';

export const orderApi = {
  checkoutRazorpay: (pickupTime) => api.post('/orders/checkout/razorpay', { pickupTime, paymentMethod: 'razorpay' }),
  get: (id) => api.get(`/orders/${id}`),
  list: () => api.get('/orders'),
  downloadInvoice: async (id, orderId) => {
    const blob = await api.get(`/orders/${id}/invoice`, { responseType: 'blob' });
    const filename = `invoice-${orderId || id}.pdf`;
    triggerBlobDownload(blob, filename);
    return blob;
  },
};
