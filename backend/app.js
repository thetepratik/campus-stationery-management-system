const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');

const routes = require('./routes');
const paymentController = require('./controllers/paymentController');
const asyncHandler = require('./utils/asyncHandler');

const {
  notFound,
  errorHandler,
} = require('./middlewares/errorMiddleware');

const {
  apiLimiter,
} = require('./middlewares/rateLimitMiddleware');

const app = express();

// Enable trust proxy for reverse proxy platforms like Render
app.set('trust proxy', 1);

/*
|--------------------------------------------------------------------------
| Security Headers
|--------------------------------------------------------------------------
*/

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin',
    },
  })
);

/*
|--------------------------------------------------------------------------
| CORS
|--------------------------------------------------------------------------
|
| Production Vercel frontend:
| https://campus-stationery-management-system.vercel.app
|
| Local frontend:
| http://localhost:5173
|
*/

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://campus-stationery-management-system.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean).map((url) => url.replace(/\/$/, ''));

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-user-role', 'x-role'],
  })
);

/*
|--------------------------------------------------------------------------
| RAZORPAY WEBHOOK
|--------------------------------------------------------------------------
|
| IMPORTANT:
|
| This MUST come before express.json().
|
| Razorpay webhook signature verification requires the EXACT
| raw request body.
|
| Do NOT add:
|
|   express.json()
|
| before this route.
|
*/

app.post(
  '/api/payments/webhook',
  express.raw({
    type: 'application/json',
  }),
  asyncHandler(paymentController.webhook)
);

/*
|--------------------------------------------------------------------------
| Body Parsers
|--------------------------------------------------------------------------
*/

app.use(
  express.json({
    limit: '2mb',
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: '2mb',
  })
);

/*
|--------------------------------------------------------------------------
| Cookie Parser
|--------------------------------------------------------------------------
*/

app.use(cookieParser());

/*
|--------------------------------------------------------------------------
| MongoDB Sanitization
|--------------------------------------------------------------------------
*/

app.use(mongoSanitize());

/*
|--------------------------------------------------------------------------
| HTTP Request Logging
|--------------------------------------------------------------------------
*/

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

/*
|--------------------------------------------------------------------------
| API Rate Limiting
|--------------------------------------------------------------------------
|
| Webhook is intentionally above this middleware.
|
| Razorpay webhook requests therefore won't be affected by
| your general API rate limiter.
|
*/

app.use('/api', apiLimiter);

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

app.use('/api', routes);

/*
|--------------------------------------------------------------------------
| Health Check
|--------------------------------------------------------------------------
*/

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Campus Stationery API is running.',
    environment: process.env.NODE_ENV || 'development',
  });
});

/*
|--------------------------------------------------------------------------
| 404 Handler
|--------------------------------------------------------------------------
*/

app.use(notFound);

/*
|--------------------------------------------------------------------------
| Global Error Handler
|--------------------------------------------------------------------------
*/

app.use(errorHandler);

module.exports = app;