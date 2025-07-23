import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './AdminDashboard.module.css';

const AdminDashboard = ({ adminInfo, onLogout }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('adminToken');

  // Fetch dashboard stats
  const fetchStats = React.useCallback(async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(res.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  }, [token]);

  // Fetch users
  const fetchUsers = React.useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/users?page=${page}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.users);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Fetch posts
  const fetchPosts = React.useCallback(async (page = 1, search = '') => {
    setLoading(true);
    try {
      const res = await axios.get(`http://localhost:5000/api/admin/posts?page=${page}&search=${search}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPosts(res.data.posts);
    } catch (err) {
      console.error('Error fetching posts:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // Delete user
  const deleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa user này?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Xóa user thành công');
      fetchUsers();
    } catch (err) {
      alert('Lỗi xóa user: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  // Delete post
  const deletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa post này?')) return;
    
    try {
      await axios.delete(`http://localhost:5000/api/admin/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Xóa post thành công');
      fetchPosts();
    } catch (err) {
      alert('Lỗi xóa post: ' + (err.response?.data?.message || 'Unknown error'));
    }
  };

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'posts') {
      fetchPosts();
    }
  }, [activeTab, fetchUsers, fetchPosts]);

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminInfo');
    onLogout();
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <h1>🛠️ Admin Panel</h1>
        <div className={styles.userInfo}>
          <span>Xin chào, {adminInfo.full_name} ({adminInfo.role})</span>
          <button onClick={handleLogout} className={styles.logoutBtn}>Đăng xuất</button>
        </div>
      </header>

      {/* Navigation */}
      <nav className={styles.nav}>
        <button 
          className={activeTab === 'dashboard' ? styles.active : ''}
          onClick={() => setActiveTab('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={activeTab === 'users' ? styles.active : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Quản lý Users
        </button>
        <button 
          className={activeTab === 'posts' ? styles.active : ''}
          onClick={() => setActiveTab('posts')}
        >
          📝 Quản lý Posts
        </button>
      </nav>

      {/* Content */}
      <main className={styles.content}>
        {activeTab === 'dashboard' && (
          <div className={styles.dashboard}>
            <h2>Thống kê tổng quan</h2>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <h3>👥 Tổng Users</h3>
                <p className={styles.statNumber}>{stats.totalUsers || 0}</p>
              </div>
              <div className={styles.statCard}>
                <h3>📝 Tổng Posts</h3>
                <p className={styles.statNumber}>{stats.totalPosts || 0}</p>
              </div>
              <div className={styles.statCard}>
                <h3>💬 Tổng Comments</h3>
                <p className={styles.statNumber}>{stats.totalComments || 0}</p>
              </div>
              <div className={styles.statCard}>
                <h3>🆕 Users hôm nay</h3>
                <p className={styles.statNumber}>{stats.todayUsers || 0}</p>
              </div>
              <div className={styles.statCard}>
                <h3>📄 Posts hôm nay</h3>
                <p className={styles.statNumber}>{stats.todayPosts || 0}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className={styles.management}>
            <h2>Quản lý Users</h2>
            {loading ? (
              <p>Đang tải...</p>
            ) : (
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Tên</th>
                      <th>Email</th>
                      <th>Posts</th>
                      <th>Followers</th>
                      <th>Following</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.post_count}</td>
                        <td>{user.followers_count}</td>
                        <td>{user.following_count}</td>
                        <td>{new Date(user.created_at).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <button 
                            onClick={() => deleteUser(user.id)}
                            className={styles.deleteBtn}
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'posts' && (
          <div className={styles.management}>
            <h2>Quản lý Posts</h2>
            {loading ? (
              <p>Đang tải...</p>
            ) : (
              <div className={styles.table}>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>User</th>
                      <th>Nội dung</th>
                      <th>Likes</th>
                      <th>Comments</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id}>
                        <td>{post.id}</td>
                        <td>{post.user_name}</td>
                        <td>{post.content.substring(0, 100)}...</td>
                        <td>{post.like_count}</td>
                        <td>{post.comment_count}</td>
                        <td>{new Date(post.created_at).toLocaleDateString('vi-VN')}</td>
                        <td>
                          <button 
                            onClick={() => deletePost(post.id)}
                            className={styles.deleteBtn}
                          >
                            🗑️ Xóa
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
