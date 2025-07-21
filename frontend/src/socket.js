// src/socket.js
import { io } from 'socket.io-client';

// Global socket instance - single connection for entire app
let socketInstance = null;

const createSocket = () => {
  if (socketInstance) {
    return socketInstance;
  }
  
  socketInstance = io('http://localhost:5000', {
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 3,
    maxReconnectionAttempts: 3,
    timeout: 5000,
    transports: ['websocket', 'polling'],
    upgrade: true,
    forceNew: false
  });

  // Add global connection event handlers
  socketInstance.on('connect', () => {
    // ...existing code...
  });

  socketInstance.on('disconnect', (reason) => {
    // ...existing code...
  });

  socketInstance.on('connect_error', (error) => {
    console.error('🚫 Global socket connection error:', error.message);
  });

  socketInstance.on('reconnect', (attemptNumber) => {
    // ...existing code...
  });

  socketInstance.on('reconnect_error', (error) => {
    console.error('🔄❌ Global socket reconnection failed:', error.message);
  });

  return socketInstance;
};

const socket = createSocket();

export default socket;
