const jwt = require('jsonwebtoken');

const adminAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');

  if (!token) {
    return res.status(401).json({ message: 'Admin access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Kiểm tra xem có phải admin token không
    if (!decoded.adminId || !decoded.role) {
      return res.status(403).json({ message: 'Admin access required' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid admin token' });
  }
};

// Middleware kiểm tra quyền super_admin
const superAdminAuth = (req, res, next) => {
  if (req.admin.role !== 'super_admin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

module.exports = { adminAuth, superAdminAuth };
