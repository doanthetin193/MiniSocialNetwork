import React, { useState, useEffect } from 'react';
import AdminLoginPage from './AdminLoginPage';
import AdminDashboard from './AdminDashboard';

const AdminApp = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [adminInfo, setAdminInfo] = useState(null);

  useEffect(() => {
    // Kiểm tra xem admin đã đăng nhập chưa
    const token = localStorage.getItem('adminToken');
    const storedAdminInfo = localStorage.getItem('adminInfo');
    
    if (token && storedAdminInfo) {
      setIsLoggedIn(true);
      setAdminInfo(JSON.parse(storedAdminInfo));
    }
  }, []);

  const handleLoginSuccess = (admin) => {
    setIsLoggedIn(true);
    setAdminInfo(admin);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setAdminInfo(null);
  };

  if (!isLoggedIn) {
    return <AdminLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  return <AdminDashboard adminInfo={adminInfo} onLogout={handleLogout} />;
};

export default AdminApp;
