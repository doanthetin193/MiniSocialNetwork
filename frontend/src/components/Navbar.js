import { Link, useNavigate } from 'react-router-dom';
import SearchUsers from './SearchUsers';
import NotificationBell from './NotificationBell';

const Navbar = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav style={{ 
      backgroundColor: '#282c34', padding: '10px', 
      display: 'flex', gap: '16px', color: 'white', alignItems: 'center'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>🏠 Trang chủ</Link>
      <Link to="/create-post" style={{ color: 'white', textDecoration: 'none' }}>✏️ Tạo bài viết</Link>
      <Link to="/myposts" style={{ color: 'white', textDecoration: 'none' }}>📝 Bài viết của tôi</Link>
      <Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>👥 Người dùng</Link>
      <Link to="/search" style={{ color: 'white', textDecoration: 'none' }}>🔍 Tìm kiếm</Link>
      <Link to="/chat" style={{ color: 'white', textDecoration: 'none' }}>💬 Chat</Link>
      
      {/* Notification Bell */}
      <NotificationBell />
      
      {/* Search Users */}
      <div style={{ flex: 1, maxWidth: 300, margin: '0 16px' }}>
        <SearchUsers />
      </div>
      
      {currentUser && (
        <Link to={`/profile/${currentUser.id}`} style={{ color: 'white', textDecoration: 'none' }}>
          👤 Profile
        </Link>
      )}
      <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>🚪 Đăng xuất</button>
    </nav>
  );
};

export default Navbar;
