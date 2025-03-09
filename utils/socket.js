// Create a new file for socket.io functionality
const { Server } = require('socket.io');

let io;

const initializeSocket = (httpServer) => {
  // Only initialize socket.io in non-serverless environments
  if (process.env.NODE_ENV !== 'production') {
    io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        credentials: true
      }
    });
    
    io.on('connection', (socket) => {
      console.log('New client connected');
      
      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }
  
  return io;
};

const getIO = () => {
  if (!io && process.env.NODE_ENV !== 'production') {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

module.exports = { initializeSocket, getIO }; 