import axios from "axios";

// Backend URL through ngrok.
// Set VITE_API_URL in frontend/.env to your backend ngrok URL.
// Example:
// VITE_API_URL=https://hurricane-debtor-idealism.ngrok-free.dev/api

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "/api",

  // Required because your application uses authentication cookies.
  withCredentials: true,
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Do NOT manually set Content-Type for FormData.
    // The browser/Axios will automatically set:
    // multipart/form-data; boundary=...
    if (!(config.data instanceof FormData)) {
      config.headers["Content-Type"] = "application/json";
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Your backend returns:
    // { success, message, data, meta }
    // So return response.data directly.
    return response.data;
  },

  (error) => {
    const message =
      error.response?.data?.message ||
      (error.response?.data?.errors &&
        error.response.data.errors[0]) ||
      error.message ||
      "Something went wrong. Please try again.";

    return Promise.reject({
      message,
      statusCode: error.response?.status,
      raw: error,
    });
  }
);

export default api;