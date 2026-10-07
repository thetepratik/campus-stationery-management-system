require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');

const app = require('./app');
const connectDB = require('./config/db');
const initSocket = require('./sockets/socketHandler');

const { isOriginAllowed } = require('./config/cors');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
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
