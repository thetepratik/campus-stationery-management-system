import api from './api';

/**
 * Build query string from params
 */
const buildQueryString = (params = {}) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value !== undefined &&
      value !== null &&
      value !== ''
    ) {
      query.append(key, value);
    }
  });

  return query.toString();
};

export const storeApi = {
  /**
   * Home Page
   */
  getHome: async () => {
    return await api.get('/store/home');
  },

  /**
   * Product List
   */
  listProducts: async (params = {}) => {
    const query = buildQueryString(params);

    return await api.get(
      `/store/products${query ? `?${query}` : ''}`
    );
  },

  /**
   * Product Details
   */
  getProduct: async (id) => {
    return await api.get(`/store/products/${id}`);
  },

  /**
   * Category Products
   */
  getProductsByCategory: async (categoryId, params = {}) => {
    const query = buildQueryString(params);

    return await api.get(
      `/store/categories/${categoryId}/products${
        query ? `?${query}` : ''
      }`
    );
  },

  /**
   * Search Products
   */
  searchProducts: async (keyword) => {
    return await api.get(
      `/store/products?search=${encodeURIComponent(keyword)}`
    );
  }
};

export default storeApi;