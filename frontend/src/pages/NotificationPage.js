import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const NotificationPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, like, comment, follow, message

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, reset = false) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/notifications?page=${pageNum}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newNotifications = res.data.notifications;
      
      if (reset) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setHasMore(res.data.hasMore);
      setPage(pageNum);
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
      
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, is_read: true } : notif
      ));
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
      
      setNotifications(notifications.map(notif => ({ ...notif, is_read: true })));
    } catch (err) {
      // ...existing code...
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId) => {
    if (!window.confirm('Bạn có chắc muốn xóa thông báo này?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setNotifications(notifications.filter(notif => notif.id !== notificationId));
    } catch (err) {
      // ...existing code...
      alert('Lỗi khi xóa thông báo');
    }
  };

  // Load more notifications
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchNotifications(page + 1, false);
    }
  };

  // Filter notifications
  const filteredNotifications = filterType === 'all' 
    ? notifications 
    : notifications.filter(notif => notif.type === filterType);

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

  // Get type icon and color
  const getTypeInfo = (type) => {
    switch (type) {
      case 'like':
        return { icon: '❤️', color: '#ff4757', label: 'Lượt thích' };
      case 'comment':
        return { icon: '💬', color: '#1da1f2', label: 'Bình luận' };
      case 'follow':
        return { icon: '👥', color: '#2ed573', label: 'Theo dõi' };
      case 'message':
        return { icon: '✉️', color: '#ffa502', label: 'Tin nhắn' };
      default:
        return { icon: '🔔', color: '#747d8c', label: 'Khác' };
    }
  };

  // Initial load
  useEffect(() => {
    fetchNotifications(1, true);
  }, []);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      {/* Header */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 24,
        paddingBottom: 16,
        borderBottom: '2px solid #e1e8ed'
      }}>
        <h1 style={{ margin: 0, fontSize: 24, color: '#14171a' }}>
          🔔 Thông báo {unreadCount > 0 && (
            <span style={{
              backgroundColor: '#ff4757',
              color: 'white',
              borderRadius: 12,
              padding: '2px 8px',
              fontSize: 12,
              marginLeft: 8
            }}>
              {unreadCount} mới
            </span>
          )}
        </h1>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            style={{
              backgroundColor: '#1da1f2',
              color: 'white',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 'bold'
            }}
          >
            Đánh dấu tất cả đã đọc
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: 8, 
        marginBottom: 24,
        borderBottom: '1px solid #e1e8ed',
        paddingBottom: 0
      }}>
        {[
          { key: 'all', label: 'Tất cả', icon: '🔔' },
          { key: 'like', label: 'Lượt thích', icon: '❤️' },
          { key: 'comment', label: 'Bình luận', icon: '💬' },
          { key: 'follow', label: 'Theo dõi', icon: '👥' },
          { key: 'message', label: 'Tin nhắn', icon: '✉️' }
        ].map(filter => (
          <button
            key={filter.key}
            onClick={() => setFilterType(filter.key)}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: filterType === filter.key ? '2px solid #1da1f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: filterType === filter.key ? 'bold' : 'normal',
              color: filterType === filter.key ? '#1da1f2' : '#657786'
            }}
          >
            {filter.icon} {filter.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      <div>
        {loading && page === 1 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#657786' }}>
            <div style={{ fontSize: 24, marginBottom: 12 }}>⏳</div>
            <p>Đang tải thông báo...</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: '#657786' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔔</div>
            <h3 style={{ margin: 0, marginBottom: 8 }}>Chưa có thông báo</h3>
            <p style={{ margin: 0 }}>
              {filterType === 'all' 
                ? 'Bạn sẽ nhận được thông báo khi có hoạt động mới'
                : `Chưa có thông báo loại ${getTypeInfo(filterType).label.toLowerCase()}`
              }
            </p>
          </div>
        ) : (
          <>
            {filteredNotifications.map((notification) => {
              const typeInfo = getTypeInfo(notification.type);
              return (
                <div key={notification.id} style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: 16,
                  backgroundColor: notification.is_read ? 'white' : '#f0f8ff',
                  border: '1px solid #e1e8ed',
                  borderRadius: 8,
                  marginBottom: 12,
                  position: 'relative',
                  transition: 'all 0.2s'
                }}>
                  {/* Icon */}
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    backgroundColor: typeInfo.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 16,
                    flexShrink: 0,
                    fontSize: 16
                  }}>
                    {typeInfo.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontSize: 16,
                      lineHeight: 1.4,
                      marginBottom: 8,
                      color: '#14171a',
                      fontWeight: notification.is_read ? 'normal' : 'bold'
                    }}>
                      {notification.message}
                    </div>
                    
                    <div style={{
                      fontSize: 14,
                      color: '#657786',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12
                    }}>
                      <span>{timeAgo(notification.created_at)}</span>
                      <span>•</span>
                      <span style={{ color: typeInfo.color }}>{typeInfo.label}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                    {/* Go to link */}
                    <Link
                      to={getNotificationLink(notification)}
                      onClick={() => {
                        if (!notification.is_read) {
                          markAsRead(notification.id);
                        }
                      }}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#1da1f2',
                        color: 'white',
                        textDecoration: 'none',
                        borderRadius: 4,
                        fontSize: 12,
                        fontWeight: 'bold'
                      }}
                    >
                      Xem
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => deleteNotification(notification.id)}
                      style={{
                        padding: '6px 8px',
                        backgroundColor: '#ff4757',
                        color: 'white',
                        border: 'none',
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontSize: 12
                      }}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Unread indicator */}
                  {!notification.is_read && (
                    <div style={{
                      position: 'absolute',
                      top: 12,
                      right: 12,
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      backgroundColor: '#1da1f2'
                    }} />
                  )}
                </div>
              );
            })}

            {/* Load More Button */}
            {hasMore && (
              <div style={{ textAlign: 'center', marginTop: 24 }}>
                <button
                  onClick={loadMore}
                  disabled={loading}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#1da1f2',
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: 14,
                    fontWeight: 'bold',
                    opacity: loading ? 0.7 : 1
                  }}
                >
                  {loading ? 'Đang tải...' : 'Tải thêm'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;
