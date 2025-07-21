const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// Lấy danh sách conversations (những người đã chat)
router.get('/conversations', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  
  try {
    const [conversations] = await db.query(`
      SELECT DISTINCT
        CASE 
          WHEN m.sender_id = ? THEN m.receiver_id 
          ELSE m.sender_id 
        END as other_user_id,
        u.name,
        u.email,
        MAX(m.created_at) as last_message_time,
        (
          SELECT content 
          FROM messages m2 
          WHERE (m2.sender_id = ? AND m2.receiver_id = other_user_id)
             OR (m2.sender_id = other_user_id AND m2.receiver_id = ?)
          ORDER BY m2.created_at DESC 
          LIMIT 1
        ) as last_message,
        (
          SELECT sender_id 
          FROM messages m3
          WHERE (m3.sender_id = ? AND m3.receiver_id = other_user_id)
             OR (m3.sender_id = other_user_id AND m3.receiver_id = ?)
          ORDER BY m3.created_at DESC 
          LIMIT 1
        ) as last_sender_id
      FROM messages m
      JOIN users u ON u.id = CASE 
        WHEN m.sender_id = ? THEN m.receiver_id 
        ELSE m.sender_id 
      END
      WHERE m.sender_id = ? OR m.receiver_id = ?
      GROUP BY other_user_id, u.name, u.email
      ORDER BY last_message_time DESC
    `, [userId, userId, userId, userId, userId, userId, userId, userId]);
    
    res.json(conversations);
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
});

// Lấy messages giữa 2 user
router.get('/:otherUserId', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;

  try {
    const [messages] = await db.query(`
      SELECT m.*, 
             s.name as sender_name,
             r.name as receiver_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `, [userId, otherUserId, otherUserId, userId]);

    res.json(messages);
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
});

// Xóa toàn bộ cuộc trò chuyện với một user
router.delete('/conversation/:otherUserId', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;

  try {
    // Xóa tất cả tin nhắn giữa 2 user này
    const [result] = await db.query(`
      DELETE FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
    `, [userId, otherUserId, otherUserId, userId]);

    res.json({ 
      message: 'Conversation deleted successfully',
      deletedCount: result.affectedRows
    });
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
});

// Gửi tin nhắn mới
router.post('/send', authMiddleware, async (req, res) => {
  const senderId = req.user.id;
  const { receiverId, content } = req.body;
  
  try {
    // Validate input
    if (!receiverId || !content || !content.trim()) {
      return res.status(400).json({ message: 'Receiver ID and content are required' });
    }
    
    // Check if receiver exists
    const [receivers] = await db.query('SELECT id FROM users WHERE id = ?', [receiverId]);
    if (receivers.length === 0) {
      return res.status(404).json({ message: 'Receiver not found' });
    }
    
    // Insert message into database
    const [result] = await db.query(
      'INSERT INTO messages (sender_id, receiver_id, content, created_at) VALUES (?, ?, ?, NOW())',
      [senderId, receiverId, content.trim()]
    );
    
    // Fetch the created message with user names
    const [messages] = await db.query(`
      SELECT 
        m.id,
        m.sender_id,
        m.receiver_id,
        m.content,
        m.created_at,
        s.name as sender_name,
        r.name as receiver_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      JOIN users r ON m.receiver_id = r.id
      WHERE m.id = ?
    `, [result.insertId]);
    
    res.status(201).json({
      message: 'Message sent successfully',
      data: messages[0]
    });
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
