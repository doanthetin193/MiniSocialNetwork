const express = require('express');
const router = express.Router();
const { createComment, getCommentsByPost } = require('../controllers/commentController');
const authMiddleware = require('../middleware/authMiddleware');

// Gửi bình luận (cần đăng nhập)
router.post('/:id/comments', authMiddleware, createComment);

// Lấy tất cả bình luận của bài viết
router.get('/:id/comments', getCommentsByPost);

module.exports = router;
