import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import styles from './RegisterPage.module.css';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordStrength, setPasswordStrength] = useState({ strength: 0, text: '' });
  const navigate = useNavigate();

  const checkPasswordStrength = (password) => {
    let strength = 0;
    let text = '';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;

    if (strength <= 2) {
      text = 'Yếu';
    } else if (strength <= 3) {
      text = 'Trung bình';
    } else {
      text = 'Mạnh';
    }

    return { strength, text };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));

    // Check password strength
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Đăng ký
      await axios.post('http://localhost:5000/api/auth/register', formData);
      
      // Tự động đăng nhập sau khi đăng ký thành công
      const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password
      });
      
      // Lưu token và user info
      localStorage.setItem('token', loginRes.data.token);
      localStorage.setItem('user', JSON.stringify(loginRes.data.user));
      
      setSuccess('Đăng ký thành công! Đang đưa bạn vào hệ thống...');
      setTimeout(() => {
        navigate('/'); // Chuyển về trang chủ
      }, 1500);
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Đăng ký thất bại! Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  const getStrengthClass = () => {
    if (passwordStrength.strength <= 2) return styles.strengthWeak;
    if (passwordStrength.strength <= 3) return styles.strengthMedium;
    return styles.strengthStrong;
  };

  const getStrengthTextClass = () => {
    if (passwordStrength.strength <= 2) return styles.weak;
    if (passwordStrength.strength <= 3) return styles.medium;
    return styles.strong;
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>🚀</div>
          <h1 className={styles.title}>Tạo tài khoản mới</h1>
          <p className={styles.subtitle}>Tham gia cộng đồng MiniSocial</p>
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

        <form onSubmit={handleSubmit} className={styles.registerForm}>
          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>👤</span>
            <input 
              type="text" 
              name="name" 
              placeholder="Họ và tên" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              className={styles.formInput}
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>📧</span>
            <input 
              type="email" 
              name="email" 
              placeholder="Địa chỉ email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
              className={styles.formInput}
              disabled={isLoading}
            />
          </div>

          <div className={styles.inputGroup}>
            <span className={styles.inputIcon}>🔒</span>
            <input 
              type={showPassword ? 'text' : 'password'} 
              name="password" 
              placeholder="Mật khẩu" 
              value={formData.password} 
              onChange={handleChange} 
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
            
            {formData.password && (
              <div className={styles.passwordStrength}>
                <div className={`${styles.strengthBar} ${getStrengthClass()}`}></div>
                <div className={`${styles.strengthText} ${getStrengthTextClass()}`}>
                  Độ mạnh mật khẩu: {passwordStrength.text}
                </div>
              </div>
            )}
          </div>

          <button 
            type="submit" 
            className={styles.registerButton}
            disabled={isLoading}
          >
            {isLoading && <span className={styles.loading}></span>}
            {isLoading ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}
          </button>
        </form>

        <div className={styles.termsSection}>
          Bằng việc đăng ký, bạn đồng ý với{' '}
          <button type="button" className={styles.termsLink}>Điều khoản dịch vụ</button>
          {' '}và{' '}
          <button type="button" className={styles.termsLink}>Chính sách bảo mật</button>
        </div>

        <div className={styles.divider}>hoặc</div>

        <div className={styles.loginLink}>
          <span className={styles.loginLinkText}>
            Đã có tài khoản?
            <Link to="/login" className={styles.loginLinkButton}>
              Đăng nhập ngay
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
