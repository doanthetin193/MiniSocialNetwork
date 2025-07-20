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
    console.error('Error fetching conversations:', err);
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
    console.error('Fetch chat error:', err);
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
    console.error('Error deleting conversation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
