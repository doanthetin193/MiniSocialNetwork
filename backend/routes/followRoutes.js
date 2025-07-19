const express = require('express');
const router = express.Router();
const { toggleFollow, getFollowers, getFollowing, getFollowStatus } = require('../controllers/followController');
const authMiddleware = require('../middleware/authMiddleware');

// Toggle follow/unfollow user (cần đăng nhập)
router.post('/:id/follow', authMiddleware, toggleFollow);

// Lấy danh sách followers của user
router.get('/:id/followers', getFollowers);

// Lấy danh sách following của user
router.get('/:id/following', getFollowing);

// Lấy trạng thái follow và số lượng followers/following (cần đăng nhập)
router.get('/:id/follow-status', authMiddleware, getFollowStatus);

module.exports = router;
