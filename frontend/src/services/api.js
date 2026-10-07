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
    // Send role hint header if saved in localStorage (avoids ambiguous cookie selection)
    const savedRole = localStorage.getItem('cs_auth_role');
    if (savedRole && !config.headers['x-user-role']) {
      config.headers['x-user-role'] = savedRole;
    }

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
    // Or binary Blob for PDF downloads.
    // So return response.data directly.
    return response.data;
  },

  async (error) => {
    let message = "Something went wrong. Please try again.";

    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const parsed = JSON.parse(text);
        message = parsed.message || (parsed.errors && parsed.errors[0]) || message;
      } catch {
        message = error.response.statusText || message;
      }
    } else if (error.response?.data?.message) {
      // Explicit message returned from backend (e.g. "Invalid email or password")
      message = error.response.data.message;
    } else if (error.response?.data?.errors && error.response.data.errors[0]) {
      message = error.response.data.errors[0];
    } else if (
      error.code === 'ERR_NETWORK' ||
      error.message === 'Network Error' ||
      !error.response
    ) {
      // Network unreachable / Render cold-start / connection refused
      message = "Unable to connect to server. Please try again.";
    } else if (error.response?.status >= 500) {
      // 5xx Internal Server Error
      message = "Server error. Please try again later.";
    } else {
      message = error.message || message;
    }

    return Promise.reject({
      message,
      statusCode: error.response?.status,
      raw: error,
    });
  }
);

export default api;