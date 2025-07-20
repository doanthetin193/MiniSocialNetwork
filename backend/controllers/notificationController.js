const db = require('../db');

// Tạo notification mới
const createNotification = async (userId, type, title, message, relatedUserId = null, relatedPostId = null) => {
  try {
    await db.query(
      'INSERT INTO notifications (user_id, type, title, message, related_user_id, related_post_id) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, type, title, message, relatedUserId, relatedPostId]
    );
    console.log(`✅ Notification created for user ${userId}: ${title}`);
  } catch (err) {
    console.error('Error creating notification:', err);
  }
};

// Lấy danh sách notifications của user
const getNotifications = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  try {
    const [notifications] = await db.query(`
      SELECT n.*, 
             u.name as related_user_name,
             u.avatar_url as related_user_avatar,
             p.content as related_post_content
      FROM notifications n
      LEFT JOIN users u ON n.related_user_id = u.id
      LEFT JOIN posts p ON n.related_post_id = p.id
      WHERE n.user_id = ?
      ORDER BY n.created_at DESC
      LIMIT ? OFFSET ?
    `, [userId, limit, offset]);

    // Đếm tổng số notifications
    const [totalResult] = await db.query(
      'SELECT COUNT(*) as total FROM notifications WHERE user_id = ?',
      [userId]
    );

    res.json({
      notifications,
      total: totalResult[0].total,
      page,
      limit,
      hasMore: (page * limit) < totalResult[0].total
    });
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Đếm số notifications chưa đọc
const getUnreadCount = async (req, res) => {
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      'SELECT COUNT(*) as unread_count FROM notifications WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ unread_count: result[0].unread_count });
  } catch (err) {
    console.error('Error getting unread count:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Đánh dấu notification đã đọc
const markAsRead = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Đánh dấu tất cả notifications đã đọc
const markAllAsRead = async (req, res) => {
  const userId = req.user.id;

  try {
    await db.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = ? AND is_read = FALSE',
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.error('Error marking all notifications as read:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xóa notification
const deleteNotification = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [result] = await db.query(
      'DELETE FROM notifications WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
};
