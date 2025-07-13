const io = require('socket.io-client');
const socket = io('http://localhost:5000');

const userId = 1;

socket.on('connect', () => {
  console.log('👤 Client 1 connected as User 1:', socket.id);
  socket.emit('register', userId);

  // Gửi tin nhắn đến user 2
  socket.emit('private_message', {
    senderId: 1,
    receiverId: 2,
    content: 'Hello from user 1'
  });
});

socket.on('receive_message', (data) => {
  console.log('📥 Client 1 received message:', data);
});
