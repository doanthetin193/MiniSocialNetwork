import React, { useState } from 'react';
import axios from 'axios';

const FollowButton = ({ userId, initialIsFollowing = false, onFollowUpdate }) => {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollow = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập để follow');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(`http://localhost:5000/api/users/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsFollowing(res.data.isFollowing);

      // Callback để parent component cập nhật
      if (onFollowUpdate) {
        onFollowUpdate(userId, res.data.isFollowing);
      }
    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Lỗi khi follow/unfollow');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleFollow}
      disabled={loading}
      style={{
        backgroundColor: isFollowing ? '#e1e8ed' : '#1da1f2',
        color: isFollowing ? '#14171a' : 'white',
        border: isFollowing ? '1px solid #aab8c2' : 'none',
        padding: '8px 16px',
        borderRadius: 20,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: 14,
        fontWeight: 'bold',
        minWidth: 80,
        opacity: loading ? 0.7 : 1
      }}
    >
      {loading ? '...' : (isFollowing ? 'Unfollow' : 'Follow')}
    </button>
  );
};

export default FollowButton;
