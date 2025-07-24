import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import SearchUsers from './SearchUsers';
import NotificationBell from './NotificationBell';
import styles from './Navbar.module.css';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/welcome');
  };

  const isActiveLink = (path) => location.pathname === path;

  return (
    <nav className={styles.navbar}>
      {/* Brand/Logo */}
      <Link to="/home" className={styles.brand}>
        🌟 MiniSocial
      </Link>

      {/* Desktop Navigation Links */}
      <div className={styles.navLinks}>
        <Link 
          to="/home" 
          className={`${styles.navLink} ${isActiveLink('/home') ? styles.active : ''}`}
        >
          🏠 Trang chủ
        </Link>
        <Link 
          to="/users" 
          className={`${styles.navLink} ${isActiveLink('/users') ? styles.active : ''}`}
        >
          👥 Người dùng
        </Link>
        <Link 
          to="/chat" 
          className={`${styles.navLink} ${isActiveLink('/chat') ? styles.active : ''}`}
        >
          💬 Chat
        </Link>
      </div>

      {/* Mobile Menu Toggle */}
      <button 
        className={styles.mobileMenuToggle}
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
      >
        ☰
      </button>

      {/* Search Section */}
      <div className={styles.searchSection}>
        <SearchUsers />
      </div>
      
      {/* User Section */}
      <div className={styles.userSection}>
        <NotificationBell />
        
        {currentUser && (
          <Link 
            to={`/profile/${currentUser.id}`} 
            className={styles.profileLink}
          >
            👤 {currentUser.name}
          </Link>
        )}
        
        <button onClick={handleLogout} className={styles.logoutButton}>
          <span className={styles.logoutIcon}>↩️</span> Đăng xuất
        </button>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.open : ''}`}>
        <Link to="/home" className={styles.mobileNavLink}>🏠 Trang chủ</Link>
        <Link to="/users" className={styles.mobileNavLink}>👥 Người dùng</Link>
        <Link to="/chat" className={styles.mobileNavLink}>💬 Chat</Link>
      </div>
    </nav>
  );
};

export default Navbar;
