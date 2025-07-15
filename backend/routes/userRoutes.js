const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// Lấy danh sách user (trừ chính mình)
router.get('/', authMiddleware, async (req, res) => {
  const userId = req.user.id;
  try {
    const [users] = await db.query(
      'SELECT id, name, email FROM users WHERE id != ?', [userId]
    );
    res.json(users);
  } catch (err) {
    console.error('Lỗi lấy danh sách users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
