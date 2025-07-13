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
      console.error('Error creating post with image:', err);
      res.status(500).json({ message: 'Server error' });
    }
  }
);

module.exports = router;
