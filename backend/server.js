require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./sockets/socketHandler');

const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://campus-stationery-management-system.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
].filter(Boolean).map((url) => url.replace(/\/$/, ''));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      const cleanOrigin = origin.replace(/\/$/, '');
      if (allowedOrigins.includes(cleanOrigin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  },
});

// Make io accessible to controllers/services via req.app.get('io')
app.set('io', io);
initSocket(io);

const start = async () => {
  await connectDB();
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on port ${PORT} (${process.env.NODE_ENV || 'development'})`);
  });
};

start();

process.on('unhandledRejection', (err) => {
  console.error(`[UnhandledRejection] ${err.message}`);
  server.close(() => process.exit(1));
});

const gracefulShutdown = (signal) => {
  console.log(`[Server] ${signal} received. Closing gracefully...`);
  server.close(() => {
    console.log('[Server] Connections closed. Process exiting.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
