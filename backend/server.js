const express = require('express');
const cors = require('cors');
require('dotenv').config();
const http = require('http'); // ✅ thêm dòng này trên đầu


const authRoutes = require('./routes/authRoutes');
const postRoutes = require('./routes/postRoutes');
const commentRoutes = require('./routes/commentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');


const app = express();

const server = http.createServer(app); // 👈 tạo server HTTP riêng
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/posts', commentRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/upload', uploadRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});


const db = require('./db');

const onlineUsers = new Map(); // userId => socketId

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Khi user login, gửi userId lên để định danh
  socket.on('register', (userId) => {
    onlineUsers.set(userId, socket.id);
    console.log(`User ${userId} online`);
  });

  // Gửi tin nhắn
  socket.on('private_message', async ({ senderId, receiverId, content }) => {
    try {
      // Lưu vào DB
      await db.query(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [senderId, receiverId, content]
      );

      const receiverSocketId = onlineUsers.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', {
          senderId,
          content,
          createdAt: new Date()
        });
      }
    } catch (err) {
      console.error('Send message error:', err);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (let [userId, sockId] of onlineUsers) {
      if (sockId === socket.id) {
        onlineUsers.delete(userId);
        break;
      }
    }
  });
});

