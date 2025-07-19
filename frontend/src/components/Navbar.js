import { Link, useNavigate } from 'react-router-dom';

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
      display: 'flex', gap: '16px', color: 'white'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>🏠 Trang chủ</Link>
      <Link to="/create-post" style={{ color: 'white', textDecoration: 'none' }}>✏️ Tạo bài viết</Link>
      <Link to="/myposts" style={{ color: 'white', textDecoration: 'none' }}>📝 Bài viết của tôi</Link>
      <Link to="/users" style={{ color: 'white', textDecoration: 'none' }}>👥 Người dùng</Link>
      <Link to="/chat" style={{ color: 'white', textDecoration: 'none' }}>💬 Chat</Link>
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
