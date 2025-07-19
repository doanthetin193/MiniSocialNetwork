const db = require('../db');

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
      
      res.json({ 
        message: 'Followed successfully',
        isFollowing: true
      });
    }
  } catch (err) {
    console.error('Toggle follow error:', err);
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
    console.error('Get followers error:', err);
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
    console.error('Get following error:', err);
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
    console.error('Get follow status error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  toggleFollow,
  getFollowers,
  getFollowing,
  getFollowStatus
};
