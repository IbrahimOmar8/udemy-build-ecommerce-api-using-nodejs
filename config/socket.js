const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/socket.io',
  });

  // Auth on handshake using JWT
  io.use((socket, next) => {
    const token =
      socket.handshake.auth?.token ||
      (socket.handshake.headers.authorization || '').replace('Bearer ', '');
    if (!token) {
      // Allow unauthenticated connections (for public rooms like Q&A views)
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.userId = decoded.userId;
    } catch (e) {
      // Invalid token: continue as anonymous
    }
    next();
  });

  io.on('connection', (socket) => {
    if (socket.userId) {
      socket.join(`user:${socket.userId}`);
    }

    socket.on('course:join', (courseId) => {
      if (courseId) socket.join(`course:${courseId}`);
    });
    socket.on('course:leave', (courseId) => {
      if (courseId) socket.leave(`course:${courseId}`);
    });
  });

  return io;
};

const getIO = () => io;

const emitToUser = (userId, event, payload) => {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
};

const emitToCourse = (courseId, event, payload) => {
  if (!io) return;
  io.to(`course:${courseId}`).emit(event, payload);
};

module.exports = { initSocket, getIO, emitToUser, emitToCourse };
