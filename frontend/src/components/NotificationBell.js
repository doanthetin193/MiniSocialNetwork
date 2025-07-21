import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/notifications/unread-count', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnreadCount(res.data.unread_count);
    } catch (err) {
      // ...existing code...
    }
  };

  // Fetch recent notifications for dropdown
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/notifications?limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(res.data.notifications);
    } catch (err) {
      // ...existing code...
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
      
      // Update unread count
      fetchUnreadCount();
    } catch (err) {
      // ...existing code...
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5000/api/notifications/read-all', {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
      setUnreadCount(0);
    } catch (err) {
      // ...existing code...
    }
  };

  // Handle bell click
  const handleBellClick = () => {
    setShowDropdown(!showDropdown);
    if (!showDropdown) {
      fetchNotifications();
    }
  };

  // Format time ago
  const timeAgo = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} ngày trước`;
  };

  // Get notification link
  const getNotificationLink = (notification) => {
    switch (notification.type) {
      case 'like':
      case 'comment':
        return `/profile/${notification.related_user_id}`;
      case 'follow':
        return `/profile/${notification.related_user_id}`;
      case 'message':
        return '/chat';
      default:
        return '/';
    }
  };

  // Initial load và Socket.IO setup
  useEffect(() => {
    if (currentUser) {
      // Chỉ fetch unread count, không tạo Socket.IO connection riêng
      // để tránh xung đột với ChatPage socket
      fetchUnreadCount();
      
      // Có thể sử dụng polling nhẹ để cập nhật notifications
      const interval = setInterval(() => {
        if (document.visibilityState === 'visible') {
          fetchUnreadCount();
        }
      }, 30000); // Check mỗi 30 giây
      
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.notification-bell')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showDropdown]);

  if (!currentUser) return null;

  return (
    <div className="notification-bell" style={{ position: 'relative' }}>
      {/* Bell Button */}
      <button
        onClick={handleBellClick}
        style={{
          backgroundColor: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          fontSize: 18,
          padding: '8px 12px',
          borderRadius: 4,
          position: 'relative',
          transition: 'background-color 0.2s'
        }}
        onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
      >
        🔔
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute',
            top: 4,
            right: 4,
            backgroundColor: '#ff4757',
            color: 'white',
            borderRadius: '50%',
            width: 18,
            height: 18,
            fontSize: 11,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold'
          }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {showDropdown && (
        <div style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          width: 320,
          maxHeight: 400,
          backgroundColor: 'white',
          border: '1px solid #e1e8ed',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          zIndex: 1000,
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #e1e8ed',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#f8f9fa'
          }}>
            <h4 style={{ margin: 0, fontSize: 16, color: '#14171a' }}>
              Thông báo
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none',
                  color: '#1da1f2',
                  cursor: 'pointer',
                  fontSize: 12,
                  padding: '4px 8px'
                }}
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {loading ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#657786' }}>
                Đang tải...
              </div>
            ) : notifications.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#657786' }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>🔔</div>
                <p style={{ margin: 0 }}>Chưa có thông báo nào</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <Link
                  key={notification.id}
                  to={getNotificationLink(notification)}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    setShowDropdown(false);
                  }}
                >
                  <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #f7f9fa',
                    backgroundColor: notification.is_read ? 'white' : '#f0f8ff',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f7f9fa'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = notification.is_read ? 'white' : '#f0f8ff'}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      {/* Icon based on type */}
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: '#1da1f2',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        flexShrink: 0,
                        fontSize: 14
                      }}>
                        {notification.type === 'like' && '❤️'}
                        {notification.type === 'comment' && '💬'}
                        {notification.type === 'follow' && '👥'}
                        {notification.type === 'message' && '✉️'}
                      </div>
                      
                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 14,
                          lineHeight: 1.4,
                          marginBottom: 4,
                          color: '#14171a'
                        }}>
                          {notification.message}
                        </div>
                        <div style={{
                          fontSize: 12,
                          color: '#657786'
                        }}>
                          {timeAgo(notification.created_at)}
                        </div>
                      </div>

                      {/* Unread indicator */}
                      {!notification.is_read && (
                        <div style={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: '#1da1f2',
                          marginLeft: 8,
                          flexShrink: 0
                        }} />
                      )}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div style={{
              padding: '8px 16px',
              borderTop: '1px solid #e1e8ed',
              textAlign: 'center',
              backgroundColor: '#f8f9fa'
            }}>
              <Link
                to="/notifications"
                style={{
                  color: '#1da1f2',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 'bold'
                }}
                onClick={() => setShowDropdown(false)}
              >
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
