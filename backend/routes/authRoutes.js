const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const db = require('../db');
    const [rows] = await db.query('SELECT id, name, email FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching user info:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
