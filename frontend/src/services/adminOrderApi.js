import api from './api';
import { triggerBlobDownload } from '../utils/downloadPdf';

const buildQueryString = (params) => {
  const query = new URLSearchParams();
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') query.append(k, v);
  });
  return query.toString();
};

export const adminOrderApi = {
  list: (params) => api.get(`/admin/orders?${buildQueryString(params)}`),
  get: (id) => api.get(`/admin/orders/${id}`),
  updateStatus: (id, status) => api.patch(`/admin/orders/${id}/status`, { status }),
  cancel: (id, reason) => api.patch(`/admin/orders/${id}/cancel`, { reason }),
  delete: (id) => api.delete(`/admin/orders/${id}`),
  downloadInvoice: async (id, orderId) => {
    const blob = await api.get(`/admin/orders/${id}/invoice`, { responseType: 'blob' });
    const filename = `invoice-${orderId || id}.pdf`;
    triggerBlobDownload(blob, filename);
    return blob;
  },
};
