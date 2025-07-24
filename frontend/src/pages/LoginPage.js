import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import socket from '../socket';
import styles from './LoginPage.module.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      // Lưu token và user info vào localStorage
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));

      // Register với socket
      socket.emit('register', res.data.user.id);

      setSuccess('Đăng nhập thành công!');
      setTimeout(() => {
        navigate('/home');
      }, 1000);
    } catch (err) {
      // ...existing code...
      setError(err.response?.data?.message || 'Đăng nhập thất bại! Vui lòng kiểm tra thông tin.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>🌟</div>
          <h1 className={styles.title}>Chào mừng trở lại</h1>
          <p className={styles.subtitle}>Đăng nhập vào MiniSocial</p>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            <span>⚠️</span>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <span>✅</span>
            {success}
          </div>
        )}

        <form onSubmit={handleLogin} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>📧</span>
            <input
              type="email"
              placeholder="Nhập email của bạn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className={styles.formInput}
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>🔒</span>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className={styles.formInput}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className={styles.passwordToggle}
              disabled={isLoading}
            >
              {showPassword ? '🙈' : '👁️'}
            </button>
          </div>

          <button 
            type="submit" 
            className={styles.loginButton}
            disabled={isLoading}
          >
            {isLoading && <span className={styles.loading}></span>}
            {isLoading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <div className={styles.divider}>hoặc</div>

        <div className={styles.registerLink}>
          <span className={styles.registerLinkText}>
            Chưa có tài khoản?
            <Link to="/register" className={styles.registerLinkButton}>
              Đăng ký ngay
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
};

export default Login;
