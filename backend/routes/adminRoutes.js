const express = require('express');
const router = express.Router();
const { adminAuth, superAdminAuth } = require('../middleware/adminMiddleware');
const {
  adminLogin,
  getDashboardStats,
  getUsers,
  deleteUser,
  getPosts,
  deletePost
} = require('../controllers/adminController');

// ===== PUBLIC ROUTES =====
router.post('/login', adminLogin);

// ===== PROTECTED ROUTES (requires admin auth) =====
router.use(adminAuth); // Tất cả routes sau đây cần admin auth

// Dashboard
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getUsers);
router.delete('/users/:id', deleteUser);

// Post Management
router.get('/posts', getPosts);
router.delete('/posts/:id', deletePost);

module.exports = router;
