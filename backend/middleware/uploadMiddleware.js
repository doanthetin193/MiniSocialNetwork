const multer = require('multer');
const path = require('path');

// Cấu hình nơi lưu ảnh và tên file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // lưu trong thư mục uploads/
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1e9) + ext;
    cb(null, uniqueName);
  }
});

// Chỉ chấp nhận ảnh
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG/PNG images allowed'), false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
