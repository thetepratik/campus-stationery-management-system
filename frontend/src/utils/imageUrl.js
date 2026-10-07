/**
 * Centralized Image URL Resolver for Campus Stationery Hub.
 * 
 * Works seamlessly in both:
 * 1. Local Development (Vite dev proxy: http://localhost:5000/api)
 * 2. Production (Vercel Frontend + Render Backend: https://campus-stationery-api.onrender.com/api)
 */

export const getImageUrl = (src, productId = null, imageIndex = 0) => {
  // If src is an object (e.g. { url: '...', fileName: '...' }), extract url or fallback
  if (src && typeof src === 'object') {
    if (src.url) {
      src = src.url;
    } else if (src.path) {
      src = src.path;
    } else if (src.src) {
      src = src.src;
    } else if (productId) {
      src = `/api/products/${productId}/images/${imageIndex}`;
    }
  }

  // If no source provided, but productId is available, construct the endpoint URL
  if (!src && productId) {
    src = `/api/products/${productId}/images/${imageIndex}`;
  }

  if (!src || typeof src !== 'string') {
    return '';
  }

  // If already absolute URL (http, https), data URL, or blob URL, return as is
  if (
    src.startsWith('http://') ||
    src.startsWith('https://') ||
    src.startsWith('data:') ||
    src.startsWith('blob:')
  ) {
    return src;
  }

  // Get configured API base URL (e.g. "https://campus-stationery-api.onrender.com/api" or "/api")
  const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').trim();

  // If running in development with Vite proxy ("/api" or relative)
  if (!rawApiUrl.startsWith('http://') && !rawApiUrl.startsWith('https://')) {
    // Relative path works via Vite proxy
    const cleanPath = src.startsWith('/') ? src : `/${src}`;
    return cleanPath;
  }

  // Production: rawApiUrl is absolute, e.g. "https://campus-stationery-api.onrender.com/api"
  // Strip trailing "/api" or "/api/" to get the backend origin: "https://campus-stationery-api.onrender.com"
  const backendOrigin = rawApiUrl.replace(/\/api\/?$/, '');

  // If src already starts with "/api/", prepend backendOrigin -> "https://campus-stationery-api.onrender.com/api/..."
  if (src.startsWith('/api/')) {
    return `${backendOrigin}${src}`;
  }

  // If src starts with "/products/" or "products/", prepend rawApiUrl without duplicate slashes
  const cleanPath = src.startsWith('/') ? src : `/${src}`;
  return `${backendOrigin}/api${cleanPath}`;
};

export const getProductImageUrl = (productId, index = 0) => {
  if (!productId) return '';
  return getImageUrl(null, productId, index);
};

export default getImageUrl;
