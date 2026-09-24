const { Server } = require('socket.io');
const env = require('./config/env');

let io = null;

function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: env.clientUrl } });
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
  });
  return io;
}

// Safe to call before init (e.g. in tests); the event is simply dropped.
function emit(event, payload) {
  if (io) io.emit(event, payload);
}

module.exports = { initSocket, emit };
