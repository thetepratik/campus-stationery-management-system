import api from './api';
import { triggerBlobDownload } from '../utils/downloadPdf';

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
  undo: (id, reason) => api.patch(`/sales/${id}/undo`, { reason }),
  invoiceUrl: (id) => `/api/sales/${id}/invoice`,
  downloadInvoice: async (id, saleId) => {
    const blob = await api.get(`/sales/${id}/invoice`, { responseType: 'blob' });
    const filename = `invoice-${saleId || id}.pdf`;
    triggerBlobDownload(blob, filename);
    return blob;
  },
};
