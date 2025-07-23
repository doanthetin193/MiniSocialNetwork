const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// ===== ADMIN AUTHENTICATION =====

// Admin Login
const adminLogin = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [admins] = await db.query('SELECT * FROM admins WHERE username = ? AND is_active = 1', [username]);
    
    if (admins.length === 0) {
      return res.status(401).json({ message: 'Tài khoản admin không tồn tại hoặc đã bị khóa' });
    }

    const admin = admins[0];
    const validPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ message: 'Mật khẩu không đúng' });
    }

    const token = jwt.sign(
      { adminId: admin.id, username: admin.username, role: admin.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Đăng nhập admin thành công',
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
        role: admin.role
      }
    });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== DASHBOARD STATS =====

const getDashboardStats = async (req, res) => {
  try {
    // Tổng số users
    const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
    
    // Tổng số posts
    const [postCount] = await db.query('SELECT COUNT(*) as count FROM posts');
    
    // Tổng số comments
    const [commentCount] = await db.query('SELECT COUNT(*) as count FROM comments');
    
    // Users đăng ký hôm nay
    const [todayUsers] = await db.query(
      'SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()'
    );
    
    // Posts hôm nay
    const [todayPosts] = await db.query(
      'SELECT COUNT(*) as count FROM posts WHERE DATE(created_at) = CURDATE()'
    );

    res.json({
      totalUsers: userCount[0].count,
      totalPosts: postCount[0].count,
      totalComments: commentCount[0].count,
      todayUsers: todayUsers[0].count,
      todayPosts: todayPosts[0].count
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== USER MANAGEMENT =====

// Lấy danh sách users
const getUsers = async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT u.*, 
             COUNT(DISTINCT p.id) as post_count,
             COUNT(DISTINCT f1.id) as following_count,
             COUNT(DISTINCT f2.id) as followers_count
      FROM users u
      LEFT JOIN posts p ON u.id = p.user_id
      LEFT JOIN follows f1 ON u.id = f1.follower_id
      LEFT JOIN follows f2 ON u.id = f2.following_id
    `;
    
    const params = [];
    
    if (search) {
      query += ' WHERE u.name LIKE ? OR u.email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' GROUP BY u.id ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [users] = await db.query(query, params);

    // Đếm tổng số users để phân trang
    let countQuery = 'SELECT COUNT(*) as total FROM users';
    const countParams = [];
    
    if (search) {
      countQuery += ' WHERE name LIKE ? OR email LIKE ?';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      users,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xóa user
const deleteUser = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM users WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User không tồn tại' });
    }

    res.json({ message: 'Xóa user thành công' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ===== POST MANAGEMENT =====

// Lấy danh sách posts
const getPosts = async (req, res) => {
  const { page = 1, limit = 20, search = '' } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT p.*, u.name as user_name, u.email as user_email,
             COUNT(DISTINCT c.id) as comment_count,
             COUNT(DISTINCT pl.id) as like_count
      FROM posts p
      JOIN users u ON p.user_id = u.id
      LEFT JOIN comments c ON p.id = c.post_id
      LEFT JOIN post_likes pl ON p.id = pl.post_id
    `;
    
    const params = [];
    
    if (search) {
      query += ' WHERE p.content LIKE ? OR u.name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' GROUP BY p.id ORDER BY p.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), parseInt(offset));

    const [posts] = await db.query(query, params);

    // Đếm tổng số posts để phân trang
    let countQuery = `
      SELECT COUNT(DISTINCT p.id) as total 
      FROM posts p 
      JOIN users u ON p.user_id = u.id
    `;
    const countParams = [];
    
    if (search) {
      countQuery += ' WHERE p.content LIKE ? OR u.name LIKE ?';
      countParams.push(`%${search}%`, `%${search}%`);
    }
    
    const [countResult] = await db.query(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      posts,
      pagination: {
        current_page: parseInt(page),
        total_pages: Math.ceil(total / limit),
        total_items: total,
        items_per_page: parseInt(limit)
      }
    });
  } catch (err) {
    console.error('Get posts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Xóa post
const deletePost = async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query('DELETE FROM posts WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Post không tồn tại' });
    }

    res.json({ message: 'Xóa post thành công' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  adminLogin,
  getDashboardStats,
  getUsers,
  deleteUser,
  getPosts,
  deletePost
};
