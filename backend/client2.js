const io = require('socket.io-client');
const socket = io('http://localhost:5000');

const userId = 2;

socket.on('connect', () => {
  console.log('👤 Client 2 connected as User 2:', socket.id);
  socket.emit('register', userId);
});

socket.on('receive_message', (data) => {
  console.log('📥 Client 2 received message:', data);
});
