# MiniSocial Network

Một ứng dụng mạng xã hội mini được xây dựng bằng React.js và Node.js

## 🚀 Tính năng

- **Xác thực người dùng**: Đăng ký, đăng nhập với JWT
- **Quản lý bài viết**: Tạo, xem, like, comment
- **Hệ thống theo dõi**: Follow/unfollow người dùng khác
- **Thông báo realtime**: Socket.IO cho thông báo tức thì
- **Chat**: Tin nhắn realtime giữa người dùng
- **Upload ảnh**: Hỗ trợ tải lên ảnh cho bài viết
- **Responsive design**: Tối ưu cho mọi thiết bị

## 🛠️ Công nghệ sử dụng

### Frontend
- React 19.1.0
- React Router DOM 7.6.3
- Axios 1.10.0
- Socket.IO Client 4.8.1
- CSS Modules

### Backend
- Node.js
- Express 5.1.0
- MySQL2 3.14.2
- Socket.IO 4.8.1
- JWT (jsonwebtoken 9.0.2)
- Bcrypt 6.0.0
- Multer 2.0.1 (file upload)

## 📦 Cài đặt

### 1. Clone repository
```bash
git clone https://github.com/doanthetin193/MiniSocialNetwork.git
cd MiniSocialNetwork
```

### 2. Cài đặt Backend
```bash
cd backend
npm install
```

### 3. Cài đặt Frontend
```bash
cd ../frontend
npm install
```

### 4. Cấu hình Database
- Tạo database MySQL
- Import file `database_extended.sql`
- Tạo file `.env` trong thư mục backend:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=minisocial
JWT_SECRET=your_jwt_secret
PORT=5000
```

## 🚀 Chạy ứng dụng

### 1. Khởi động Backend
```bash
cd backend
npm start
```
Backend sẽ chạy trên http://localhost:5000

### 2. Khởi động Frontend
```bash
cd frontend
npm start
```
Frontend sẽ chạy trên http://localhost:3000

## 📁 Cấu trúc Project

```
MiniSocial/
├── backend/
│   ├── controllers/          # Logic xử lý API
│   ├── middleware/           # Authentication & Upload middleware
│   ├── routes/              # Định tuyến API
│   ├── uploads/             # Thư mục lưu file upload
│   ├── db.js               # Kết nối database
│   └── server.js           # Entry point
├── frontend/
│   ├── public/             # Static files
│   └── src/
│       ├── components/     # React components
│       ├── pages/         # Page components
│       ├── api/           # API calls
│       └── contexts/      # React contexts
└── database_extended.sql   # Database schema
```

## 🌟 Tính năng chi tiết

### Người dùng
- Đăng ký tài khoản với xác thực email
- Đăng nhập/đăng xuất
- Xem và chỉnh sửa profile
- Upload avatar

### Bài viết
- Tạo bài viết với text và hình ảnh
- Like/unlike bài viết
- Comment và reply
- Xem danh sách bài viết theo thời gian

### Mạng xã hội
- Follow/unfollow người dùng
- Xem danh sách followers/following
- Tìm kiếm người dùng và bài viết

### Thông báo
- Thông báo khi có người follow
- Thông báo khi có like/comment
- Realtime notifications với Socket.IO

### Chat
- Tin nhắn 1-1 realtime
- Hiển thị trạng thái online/offline
- Lịch sử tin nhắn

## 🔧 Deploy

### 1. Build Frontend
```bash
cd frontend
npm run build
```

### 2. Cấu hình Production
- Cập nhật database credentials
- Cấu hình CORS cho production
- Setup reverse proxy (nginx)
- Configure SSL certificates

## 🤝 Đóng góp

1. Fork project
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

Project này được phân phối dưới MIT License. Xem file `LICENSE` để biết thêm chi tiết.

## 📞 Liên hệ

- Email: doanthetindeveloper@gmail.com
- GitHub: [@doanthetin193](https://github.com/doanthetin193)

---

⭐ Nếu project này hữu ích, hãy cho chúng tôi một star!
