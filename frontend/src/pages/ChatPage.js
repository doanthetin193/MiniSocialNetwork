import React, { useState, useEffect } from 'react';
import socket from '../socket';
import axios from 'axios';

const ChatPage = () => {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [receiverId, setReceiverId] = useState('');
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('📦 Token hiện tại:', token); // 👈 log token để kiểm tra

      const res = await axios.get('http://localhost:5000/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('📨 Danh sách user nhận được:', res.data); // 👈 log danh sách user
      setUsers(res.data);
    } catch (err) {
      console.error('❌ Lỗi lấy users:', err.response?.data || err.message);
    }
  };

  fetchUsers();
}, []);


  useEffect(() => {
    if (currentUser) {
      socket.emit('register', currentUser.id);
    }

    socket.on('receive_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    return () => socket.off('receive_message');
  }, [currentUser]);

  const fetchChat = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/chat/${receiverId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Lỗi lấy tin nhắn:', err);
    }
  };

  const sendMessage = () => {
    if (!content.trim()) return;
    socket.emit('private_message', {
      senderId: currentUser.id,
      receiverId,
      content,
    });
    setMessages(prev => [...prev, {
      senderId: currentUser.id,
      content,
      createdAt: new Date()
    }]);
    setContent('');
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>💬 Chat</h2>
        <select value={receiverId} onChange={(e) => setReceiverId(e.target.value)}>
            <option value="">-- Chọn người nhận --</option>
                {users.map(user => (
                <option key={user.id} value={user.id}>
                {user.name} ({user.email})
            </option>
            ))}
        </select>

      <button onClick={fetchChat}>Xem lịch sử</button>

      <div style={{ marginTop: 10, borderTop: '1px solid #ccc', paddingTop: 10 }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ textAlign: msg.senderId === currentUser.id ? 'right' : 'left' }}>
            <p><strong>{msg.senderId === currentUser.id ? 'Tôi' : 'Họ'}</strong>: {msg.content}</p>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20 }}>
        <input
          placeholder="Nhập tin nhắn..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
        />
        <button onClick={sendMessage}>Gửi</button>
      </div>
    </div>
  );
};

export default ChatPage;
