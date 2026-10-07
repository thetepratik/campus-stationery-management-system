import api from './api';

const toFormData = (data, file) => {
  const fd = new FormData();
  Object.entries(data).forEach(([k, v]) => {
    if (v !== undefined && v !== null) fd.append(k, v);
  });
  if (file) fd.append('image', file);
  return fd;
};

export const categoryApi = {
  list: () => api.get('/categories'),
  get: (id) => api.get(`/categories/${id}`),
  create: (data, file) =>
    api.post('/categories', toFormData(data, file)),
  update: (id, data, file) =>
    api.put(`/categories/${id}`, toFormData(data, file)),
  remove: (id) => api.delete(`/categories/${id}`),
};
