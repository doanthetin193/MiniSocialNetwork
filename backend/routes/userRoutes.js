const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const db = require('../db');

// Lấy danh sách user
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email FROM users ORDER BY name'
    );
    res.json(users);
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
});

// Tìm kiếm người dùng
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { q } = req.query; // query parameter
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    
    const searchTerm = `%${q.trim()}%`;
    const [users] = await db.query(
      'SELECT id, name, email FROM users WHERE name LIKE ? OR email LIKE ? ORDER BY name LIMIT 20',
      [searchTerm, searchTerm]
    );
    
    res.json(users);
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
