const express = require('express');
const router = express.Router();
const { createPost, getAllPosts, getMyPosts,updatePost,deletePost } = require('../controllers/postController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
// Route tạo bài viết (cần đăng nhập)
router.post('/', authMiddleware, createPost);

// Route xem tất cả bài viết
router.get('/', getAllPosts);

router.get('/mine', authMiddleware, getMyPosts);
router.put('/:id', authMiddleware, updatePost);
router.delete('/:id', authMiddleware, deletePost);
// Route đăng bài kèm ảnh
router.post(
  '/with-image',
  authMiddleware,
  upload.single('image'),
  async (req, res) => {
    const db = require('../db');
    const userId = req.user.id;
    const content = req.body.content;
    const file = req.file;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Content is required' });
    }

    const imageUrl = file
      ? `${req.protocol}://${req.get('host')}/uploads/${file.filename}`
      : null;

    try {
      await db.query(
        'INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)',
        [userId, content, imageUrl]
      );

      res.status(201).json({ message: 'Post with image created successfully' });
    } catch (err) {
      // ...existing code...
      res.status(500).json({ message: 'Server error' });
    }
  }
);

// Route tìm kiếm bài viết
router.get('/search', async (req, res) => {
  try {
    const db = require('../db');
    const { q, author, date_from, date_to } = req.query;
    
    if (!q || q.trim().length === 0) {
      return res.json([]);
    }
    
    let query = `
      SELECT p.*, u.name, u.email,
             (SELECT COUNT(*) FROM post_likes WHERE post_id = p.id) as likes_count,
             (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count
      FROM posts p 
      JOIN users u ON p.user_id = u.id 
      WHERE 1=1
    `;
    
    const params = [];
    
    // Tìm kiếm theo nội dung bài viết
    if (q && q.trim().length > 0) {
      query += ' AND p.content LIKE ?';
      params.push(`%${q.trim()}%`);
    }
    
    // Filter theo tác giả
    if (author && author.trim().length > 0) {
      query += ' AND u.name LIKE ?';
      params.push(`%${author.trim()}%`);
    }
    
    // Filter theo ngày
    if (date_from) {
      query += ' AND DATE(p.created_at) >= ?';
      params.push(date_from);
    }
    
    if (date_to) {
      query += ' AND DATE(p.created_at) <= ?';
      params.push(date_to);
    }
    
    query += ' ORDER BY p.created_at DESC LIMIT 50';
    
    const [posts] = await db.query(query, params);
    res.json(posts);
    
  } catch (err) {
    // ...existing code...
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
