const express = require('express');
const router = express.Router();
const { 
  getNotifications, 
  getUnreadCount, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} = require('../controllers/notificationController');
const authMiddleware = require('../middleware/authMiddleware');

// Lấy danh sách notifications của user (có pagination)
router.get('/', authMiddleware, getNotifications);

// Đếm số notifications chưa đọc
router.get('/unread-count', authMiddleware, getUnreadCount);

// Đánh dấu notification đã đọc
router.put('/:id/read', authMiddleware, markAsRead);

// Đánh dấu tất cả notifications đã đọc
router.put('/read-all', authMiddleware, markAllAsRead);

// Xóa notification
router.delete('/:id', authMiddleware, deleteNotification);

module.exports = router;
