import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthChecker = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const currentPath = window.location.pathname;

    // Nếu đang ở root path (/) 
    if (currentPath === '/') {
      if (token) {
        // Đã đăng nhập -> redirect tới home
        navigate('/home');
      } else {
        // Chưa đăng nhập -> redirect tới welcome
        navigate('/welcome');
      }
    }
  }, [navigate]);

  return children;
};

export default AuthChecker;
