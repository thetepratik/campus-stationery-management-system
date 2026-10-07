/**
 * Centralized CORS Configuration
 *
 * Configures origin allowlist, credentials, methods, and headers
 * for both Express HTTP endpoints and Socket.IO connections.
 */

// Production and preview domains for Campus Stationery Hub
const DEFAULT_ALLOWED_ORIGINS = [
  'https://campus-stationery-management-system.vercel.app',
  'https://campus-stationery-management-system-8bucon45k-ai-error.vercel.app',
];

// Standard local development origins
const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
];

/**
 * Parses and returns all configured allowed origins from environment and defaults.
 * @returns {string[]}
 */
const getAllowedOrigins = () => {
  const origins = new Set();

  // 1. Add default production and known deployment origins
  DEFAULT_ALLOWED_ORIGINS.forEach((url) => {
    origins.add(url.trim().replace(/\/$/, ''));
  });

  // 2. Parse CLIENT_URL environment variable (supports single or comma-separated)
  if (process.env.CLIENT_URL) {
    process.env.CLIENT_URL.split(',').forEach((url) => {
      const clean = url.trim().replace(/\/$/, '');
      if (clean) origins.add(clean);
    });
  }

  // 3. Parse CLIENT_URLS environment variable (comma-separated support)
  if (process.env.CLIENT_URLS) {
    process.env.CLIENT_URLS.split(',').forEach((url) => {
      const clean = url.trim().replace(/\/$/, '');
      if (clean) origins.add(clean);
    });
  }

  // 4. Parse FRONTEND_URL environment variable as alias if provided
  if (process.env.FRONTEND_URL) {
    process.env.FRONTEND_URL.split(',').forEach((url) => {
      const clean = url.trim().replace(/\/$/, '');
      if (clean) origins.add(clean);
    });
  }

  // 5. In non-production or test, add local development origins
  if (process.env.NODE_ENV !== 'production') {
    DEV_ORIGINS.forEach((url) => {
      origins.add(url);
    });
  }

  return Array.from(origins);
};

/**
 * Checks if a requesting origin is permitted.
 * @param {string|undefined} origin
 * @returns {boolean}
 */
const isOriginAllowed = (origin) => {
  // Allow requests without Origin header (e.g. mobile apps, curl, server-to-server, health checks)
  if (!origin) return true;

  const cleanOrigin = origin.trim().replace(/\/$/, '');
  const allowedList = getAllowedOrigins();

  // Direct allowlist match
  if (allowedList.includes(cleanOrigin)) {
    return true;
  }

  // Safe Vercel preview & branch deployment validation for this specific project
  // Matches:
  // - https://campus-stationery-management-system.vercel.app
  // - https://campus-stationery-management-system-<branch-or-hash>-<team>.vercel.app
  // - https://campus-stationery-hub-<...>.vercel.app
  const vercelProjectPattern =
    /^https:\/\/campus-stationery-(management-system|hub)(-[a-zA-Z0-9_-]+)?\.vercel\.app$/i;

  if (vercelProjectPattern.test(cleanOrigin)) {
    return true;
  }

  // Local development pattern (localhost / 127.0.0.1 on any port) in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const localhostPattern = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i;
    if (localhostPattern.test(cleanOrigin)) {
      return true;
    }
  }

  return false;
};

/**
 * Express cors middleware configuration options.
 */
const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },

  credentials: true,

  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'x-user-role',
    'x-role',
  ],

  exposedHeaders: ['Content-Range', 'X-Content-Range', 'Content-Disposition'],

  // Legacy browser / reverse proxy compatibility for preflight 204 vs 200
  optionsSuccessStatus: 200,

  // Cache preflight response for 24 hours (86400 seconds)
  maxAge: 86400,
};

module.exports = {
  getAllowedOrigins,
  isOriginAllowed,
  corsOptions,
};
