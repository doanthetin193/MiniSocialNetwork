-- 1. Tạo database (nếu chưa có)
CREATE DATABASE IF NOT EXISTS mini_social_app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Sử dụng database
USE mini_social_app;

-- 3. Xoá bảng nếu tồn tại để reset
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS post_likes;
DROP TABLE IF EXISTS follows;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS admins;
DROP TABLE IF EXISTS users;

-- 4. Bảng người dùng
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Bảng bài viết
CREATE TABLE posts (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Bảng bình luận
CREATE TABLE comments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    post_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Bảng tin nhắn
CREATE TABLE messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sender_id INT NOT NULL,
    receiver_id INT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 8. Bảng likes cho bài viết
CREATE TABLE post_likes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    post_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_post_like (user_id, post_id)
);

-- 9. Bảng follows (theo dõi người dùng)
CREATE TABLE follows (
    id INT PRIMARY KEY AUTO_INCREMENT,
    follower_id INT NOT NULL,      -- Người theo dõi
    following_id INT NOT NULL,     -- Người được theo dõi
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_follow (follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- 10. Bảng admin
CREATE TABLE admins (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Bảng thông báo
CREATE TABLE notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,                    -- Người nhận thông báo
    type ENUM('like', 'comment', 'follow', 'message') NOT NULL,
    title VARCHAR(255) NOT NULL,             -- Tiêu đề ngắn gọn
    message TEXT NOT NULL,                   -- Nội dung chi tiết
    related_user_id INT,                     -- User liên quan (ai đã like/follow)
    related_post_id INT,                     -- Post liên quan (nếu có)
    is_read BOOLEAN DEFAULT FALSE,           -- Đã đọc chưa
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (related_post_id) REFERENCES posts(id) ON DELETE CASCADE,
    
    INDEX idx_user_notifications (user_id, is_read, created_at DESC)
);

-- ===============================
-- THÊM DỮ LIỆU MẪU CHO ADMIN
-- ===============================

-- Tạo tài khoản admin mặc định (password: admin123)
INSERT INTO admins (username, email, password_hash, full_name, role) VALUES 
('admin', 'admin@minisocial.com', '$2b$10$.j78or53emKmMRhu83oDlOUEIIAtNuqJkT5nwXhKjHnQ900aVAvxG', 'System Administrator', 'super_admin');

-- Lưu ý: password_hash trên tương ứng với password "admin123"
-- Bạn có thể đăng nhập admin với:
-- Username: admin
-- Password: admin123