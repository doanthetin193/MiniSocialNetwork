const db = require('../db');
const { createNotification } = require('./notificationController');

const createComment = async (req, res) => {
  const { id: postId } = req.params;
  const { content } = req.body;
  const userId = req.user.id;

  if (!content || content.trim() === '') {
    return res.status(400).json({ message: 'Content is required' });
  }

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

    // Thêm comment
    await db.query(
      'INSERT INTO comments (post_id, user_id, content) VALUES (?, ?, ?)',
      [postId, userId, content]
    );

    // Tạo notification nếu không phải comment vào post của chính mình
    if (postOwnerId !== userId) {
      const [commenterInfo] = await db.query('SELECT name FROM users WHERE id = ?', [userId]);
      const commenterName = commenterInfo[0]?.name || 'Someone';
      
      // Truncate comment content cho notification
      const shortContent = content.length > 50 ? content.substring(0, 50) + '...' : content;
      
      await createNotification(
        postOwnerId,                           // user_id (người nhận)
        'comment',                             // type
        'Bình luận mới',                       // title
        `${commenterName} đã bình luận: "${shortContent}"`,  // message
        userId,                                // related_user_id
        postId                                 // related_post_id
      );

      // ✅ Gửi real-time notification
      try {
        const { io, onlineUsers } = require('../server');
        const userSocketId = onlineUsers?.get(postOwnerId);
        if (userSocketId && io) {
          io.to(userSocketId).emit('new_notification', {
            type: 'comment',
            title: 'Bình luận mới',
            message: `${commenterName} đã bình luận: "${shortContent}"`,
            created_at: new Date(),
            related_user_id: userId,
            related_user_name: commenterName,
            related_post_id: postId,
            is_read: false
          });
        }
      } catch (err) {
        console.error('Error sending realtime comment notification:', err);
      }
    }

    res.status(201).json({ message: 'Comment added successfully' });
  } catch (err) {
    console.error('Error adding comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getCommentsByPost = async (req, res) => {
  const { id: postId } = req.params;

  try {
    const [comments] = await db.query(`
      SELECT comments.id, comments.content, comments.created_at,
             users.id as user_id, users.name, users.email
      FROM comments
      JOIN users ON comments.user_id = users.id
      WHERE comments.post_id = ?
      ORDER BY comments.created_at ASC
    `, [postId]);

    res.json(comments);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  createComment,
  getCommentsByPost
};
