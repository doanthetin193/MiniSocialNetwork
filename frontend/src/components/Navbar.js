import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <nav style={{ 
      backgroundColor: '#282c34', padding: '10px', 
      display: 'flex', gap: '16px', color: 'white'
    }}>
      <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Trang chủ</Link>
      <Link to="/create" style={{ color: 'white', textDecoration: 'none' }}>Tạo bài viết</Link>
      <Link to="/myposts" style={{ color: 'white', textDecoration: 'none' }}>Bài viết của tôi</Link>
      <button onClick={handleLogout} style={{ marginLeft: 'auto' }}>Đăng xuất</button>
    </nav>
  );
};

export default Navbar;
