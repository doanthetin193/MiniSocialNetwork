const express = require('express');
const router = express.Router();
const { toggleLike, getPostLikes, getPostLikeStatus } = require('../controllers/likeController');
const authMiddleware = require('../middleware/authMiddleware');

// Toggle like/unlike bài viết (cần đăng nhập)
router.post('/:id/like', authMiddleware, toggleLike);

// Lấy danh sách users đã like bài viết
router.get('/:id/likes', getPostLikes);

// Lấy số lượng likes và trạng thái like của user hiện tại (cần đăng nhập)
router.get('/:id/like-status', authMiddleware, getPostLikeStatus);

module.exports = router;
