const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

router.get('/:otherUserId', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.otherUserId;

  try {
    const [messages] = await db.query(`
      SELECT * FROM messages 
      WHERE (sender_id = ? AND receiver_id = ?)
         OR (sender_id = ? AND receiver_id = ?)
      ORDER BY created_at ASC
    `, [userId, otherUserId, otherUserId, userId]);

    res.json(messages);
  } catch (err) {
    console.error('Fetch chat error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
