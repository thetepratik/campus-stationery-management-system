/**
 * Socket.IO connection handler. Full event set (order:new, payment:success,
 * stock:low, etc.) is implemented in Phase 12 — this stub wires the server
 * and room-join convention now so later phases just add emits.
 */
const initSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`[Socket.IO] Client connected: ${socket.id}`);

    socket.on('join:admin', () => {
      socket.join('admin-room');
    });

    socket.on('join:student', (studentId) => {
      if (studentId) socket.join(`student-${studentId}`);
    });

    socket.on('disconnect', () => {
      console.log(`[Socket.IO] Client disconnected: ${socket.id}`);
    });
  });
};

module.exports = initSocket;
