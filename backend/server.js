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
const likeRoutes = require('./routes/likeRoutes');
const followRoutes = require('./routes/followRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');


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
app.use('/api/posts', likeRoutes);
app.use('/api/users', followRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  // ...existing code...
});


const db = require('./db');

// ✅ Export io để các controller khác có thể dùng
module.exports = { io, onlineUsers: null };

const onlineUsers = new Map(); // userId => socketId

// ✅ Cập nhật export để các controller có thể truy cập
module.exports.onlineUsers = onlineUsers;

io.on('connection', (socket) => {
  // ...existing code...
  
  let registeredUserId = null; // Track user for this socket

  // Khi user login, gửi userId lên để định danh
  socket.on('register', (userId) => {
    const userIdInt = parseInt(userId);
    
    // Avoid duplicate registration
    if (registeredUserId === userIdInt) {
      // ...existing code...
      return;
    }
    
    // Remove old socket if user is already online from another connection
    if (onlineUsers.has(userIdInt)) {
      // ...existing code...
    }
    
    onlineUsers.set(userIdInt, socket.id);
    registeredUserId = userIdInt;
    // ...existing code...
    
    // Broadcast online status to all clients
    socket.broadcast.emit('user_online', { userId: userIdInt, online: true });
  });

  // Typing indicator
  socket.on('typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(parseInt(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_typing', { senderId });
    }
  });

  socket.on('stop_typing', ({ senderId, receiverId }) => {
    const receiverSocketId = onlineUsers.get(parseInt(receiverId));
    if (receiverSocketId) {
      io.to(receiverSocketId).emit('user_stop_typing', { senderId });
    }
  });

  // Gửi tin nhắn
  socket.on('private_message', async ({ senderId, receiverId, content }) => {
    try {
      // Lưu vào DB
      const [result] = await db.query(
        'INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)',
        [senderId, receiverId, content]
      );

      // Lấy thông tin user names
      const [senderInfo] = await db.query('SELECT name FROM users WHERE id = ?', [senderId]);
      const [receiverInfo] = await db.query('SELECT name FROM users WHERE id = ?', [receiverId]);

      // Lấy socketId của receiver
      const receiverSocketId = onlineUsers.get(parseInt(receiverId));

      const messageData = {
        id: result.insertId,
        senderId: parseInt(senderId),
        receiverId: parseInt(receiverId),
        content,
        createdAt: new Date(),
        sender_name: senderInfo[0]?.name,
        receiver_name: receiverInfo[0]?.name
      };

      // Tạo notification cho người nhận tin nhắn
      const { createNotification } = require('./controllers/notificationController');
      const senderName = senderInfo[0]?.name || 'Someone';
      const shortContent = content.length > 30 ? content.substring(0, 30) + '...' : content;
      
      await createNotification(
        receiverId,                            // user_id (người nhận)
        'message',                             // type
        'Tin nhắn mới',                        // title
        `${senderName} đã gửi: "${shortContent}"`,  // message
        senderId,                              // related_user_id
        null                                   // related_post_id
      );

      // 🔥 Gửi real-time notification cho người nhận
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('new_notification', {
          type: 'message',
          title: 'Tin nhắn mới',
          message: `${senderName} đã gửi: "${shortContent}"`,
          created_at: new Date(),
          related_user_id: senderId,
          related_user_name: senderName,
          is_read: false
        });
      }

      // Gửi cho receiver
      if (receiverSocketId) {
        io.to(receiverSocketId).emit('receive_message', messageData);
      }

      // Gửi lại cho sender để confirm (nếu sender khác socket hiện tại)
      socket.emit('message_sent', messageData);

    } catch (err) {
      // ...existing code...
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Check online status
  socket.on('check_online', (userIds) => {
    const onlineStatus = {};
    userIds.forEach(userId => {
      const isOnline = onlineUsers.has(parseInt(userId));
      onlineStatus[userId] = isOnline;
    });
    socket.emit('online_status', onlineStatus);
  });

  socket.on('disconnect', () => {
    // ...existing code...
    
    // Remove user from online list if this was their socket
    if (registeredUserId && onlineUsers.get(registeredUserId) === socket.id) {
      onlineUsers.delete(registeredUserId);
      // ...existing code...
      
      // Broadcast offline status
      socket.broadcast.emit('user_online', { userId: registeredUserId, online: false });
    }
  });
});

