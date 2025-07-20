const db = require('../db');
const { createNotification } = require('./notificationController');

// Like hoặc Unlike bài viết
const toggleLike = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;

  try {
    // Lấy thông tin post và chủ post
    const [postInfo] = await db.query(
      'SELECT p.*, u.name as post_owner_name FROM posts p JOIN users u ON p.user_id = u.id WHERE p.id = ?',
      [postId]
    );

    if (postInfo.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    const post = postInfo[0];
    const postOwnerId = post.user_id;

    // Kiểm tra user đã like bài viết này chưa
    const [existingLike] = await db.query(
      'SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    if (existingLike.length > 0) {
      // Đã like rồi → Unlike
      await db.query(
        'DELETE FROM post_likes WHERE user_id = ? AND post_id = ?',
        [userId, postId]
      );
      
      res.json({ 
        message: 'Post unliked successfully',
        liked: false
      });
    } else {
      // Chưa like → Like
      await db.query(
        'INSERT INTO post_likes (user_id, post_id) VALUES (?, ?)',
        [userId, postId]
      );

      // Tạo notification nếu không phải like post của chính mình
      if (postOwnerId !== userId) {
        const [likerInfo] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
        const likerName = likerInfo[0]?.name || 'Someone';
        
        await createNotification(
          postOwnerId,                    // user_id (người nhận)
          'like',                         // type
          'Bài viết được thích',          // title
          `${likerName} đã thích bài viết của bạn`,  // message
          userId,                         // related_user_id
          postId                          // related_post_id
        );

        // ✅ Gửi real-time notification
        try {
          const { io, onlineUsers } = require('../server');
          const userSocketId = onlineUsers?.get(postOwnerId);
          if (userSocketId && io) {
            io.to(userSocketId).emit('new_notification', {
              type: 'like',
              title: 'Bài viết được thích',
              message: `${likerName} đã thích bài viết của bạn`,
              created_at: new Date(),
              related_user_id: userId,
              related_user_name: likerName,
              related_post_id: postId,
              is_read: false
            });
          }
        } catch (err) {
          console.error('Error sending realtime like notification:', err);
        }
      }
      
      res.json({ 
        message: 'Post liked successfully',
        liked: true
      });
    }
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy danh sách users đã like bài viết
const getPostLikes = async (req, res) => {
  const { id: postId } = req.params;

  try {
    const [likes] = await db.query(`
      SELECT post_likes.id, post_likes.created_at,
             users.id as user_id, users.name, users.email, users.avatar_url
      FROM post_likes
      JOIN users ON post_likes.user_id = users.id
      WHERE post_likes.post_id = ?
      ORDER BY post_likes.created_at DESC
    `, [postId]);

    res.json(likes);
  } catch (err) {
    console.error('Get post likes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy số lượng likes và trạng thái like của user hiện tại
const getPostLikeStatus = async (req, res) => {
  const { id: postId } = req.params;
  const userId = req.user.id;

  try {
    // Đếm tổng số likes
    const [countResult] = await db.query(
      'SELECT COUNT(*) as likes_count FROM post_likes WHERE post_id = ?',
      [postId]
    );

    // Kiểm tra user hiện tại đã like chưa
    const [userLike] = await db.query(
      'SELECT * FROM post_likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    res.json({
      likes_count: countResult[0].likes_count,
      is_liked: userLike.length > 0
    });
  } catch (err) {
    console.error('Get like status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  toggleLike,
  getPostLikes,
  getPostLikeStatus
};
