const db = require('../db');
const { createNotification } = require('./notificationController');

// Follow hoặc Unfollow user
const toggleFollow = async (req, res) => {
  const { id: targetUserId } = req.params;
  const currentUserId = req.user.id;

  // Không thể follow chính mình
  if (parseInt(targetUserId) === parseInt(currentUserId)) {
    return res.status(400).json({ message: 'Không thể follow chính mình' });
  }

  try {
    // Kiểm tra đã follow chưa
    const [existingFollow] = await db.query(
      'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
      [currentUserId, targetUserId]
    );

    if (existingFollow.length > 0) {
      // Đã follow rồi → Unfollow
      await db.query(
        'DELETE FROM follows WHERE follower_id = ? AND following_id = ?',
        [currentUserId, targetUserId]
      );
      
      res.json({ 
        message: 'Unfollowed successfully',
        isFollowing: false
      });
    } else {
      // Chưa follow → Follow
      await db.query(
        'INSERT INTO follows (follower_id, following_id) VALUES (?, ?)',
        [currentUserId, targetUserId]
      );

      // Tạo notification cho người được follow
      const [followerInfo] = await db.query('SELECT name FROM users WHERE id = ?', [currentUserId]);
      const followerName = followerInfo[0]?.name || 'Someone';
      
      await createNotification(
        targetUserId,                          // user_id (người nhận)
        'follow',                              // type
        'Follower mới',                        // title
        `${followerName} đã theo dõi bạn`,     // message
        currentUserId,                         // related_user_id
        null                                   // related_post_id
      );

      // ✅ Gửi real-time notification
      try {
        const { io, onlineUsers } = require('../server');
        const userSocketId = onlineUsers?.get(targetUserId);
        if (userSocketId && io) {
          io.to(userSocketId).emit('new_notification', {
            type: 'follow',
            title: 'Follower mới',
            message: `${followerName} đã theo dõi bạn`,
            created_at: new Date(),
            related_user_id: currentUserId,
            related_user_name: followerName,
            related_post_id: null,
            is_read: false
          });
        }
      } catch (err) {
        // ...existing code...
      }
      
      res.json({ 
        message: 'Followed successfully',
        isFollowing: true
      });
    }
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy danh sách followers của một user
const getFollowers = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const [followers] = await db.query(`
      SELECT follows.id, follows.created_at,
             users.id as user_id, users.name, users.email, users.avatar_url
      FROM follows
      JOIN users ON follows.follower_id = users.id
      WHERE follows.following_id = ?
      ORDER BY follows.created_at DESC
    `, [userId]);

    res.json(followers);
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
};

// Lấy danh sách following của một user
const getFollowing = async (req, res) => {
  const { id: userId } = req.params;

  try {
    const [following] = await db.query(`
      SELECT follows.id, follows.created_at,
             users.id as user_id, users.name, users.email, users.avatar_url
      FROM follows
      JOIN users ON follows.following_id = users.id
      WHERE follows.follower_id = ?
      ORDER BY follows.created_at DESC
    `, [userId]);

    res.json(following);
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
};

// Kiểm tra trạng thái follow và đếm số followers/following
const getFollowStatus = async (req, res) => {
  const { id: targetUserId } = req.params;
  const currentUserId = req.user.id;

  try {
    // Đếm followers
    const [followersCount] = await db.query(
      'SELECT COUNT(*) as followers_count FROM follows WHERE following_id = ?',
      [targetUserId]
    );

    // Đếm following
    const [followingCount] = await db.query(
      'SELECT COUNT(*) as following_count FROM follows WHERE follower_id = ?',
      [targetUserId]
    );

    // Kiểm tra user hiện tại có follow target user không
    const [isFollowing] = await db.query(
      'SELECT * FROM follows WHERE follower_id = ? AND following_id = ?',
      [currentUserId, targetUserId]
    );

    res.json({
      followers_count: followersCount[0].followers_count,
      following_count: followingCount[0].following_count,
      is_following: isFollowing.length > 0
    });
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFollowStatus
};
