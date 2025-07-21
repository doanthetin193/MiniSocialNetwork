import React from 'react';
import axios from 'axios';

const LikeButton = ({ postId, initialLikesCount, initialIsLiked, onLikeUpdate }) => {
  const [likesCount, setLikesCount] = React.useState(initialLikesCount || 0);
  const [isLiked, setIsLiked] = React.useState(initialIsLiked || false);

  const handleLike = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Bạn cần đăng nhập để thích bài viết');
      return;
    }

    try {
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newIsLiked = res.data.liked;
      const newLikesCount = newIsLiked ? likesCount + 1 : likesCount - 1;

      setIsLiked(newIsLiked);
      setLikesCount(newLikesCount);

      // Callback để parent component cập nhật
      if (onLikeUpdate) {
        onLikeUpdate(postId, newIsLiked, newLikesCount);
      }
    } catch (err) {
      // ...existing code...
      alert('Lỗi khi thích bài viết');
    }
  };

  return (
    <button 
      onClick={handleLike}
      style={{ 
        backgroundColor: isLiked ? '#ff4757' : '#f1f2f6',
        color: isLiked ? 'white' : '#2f3640',
        border: 'none',
        padding: '6px 12px',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '14px',
        transition: 'all 0.3s ease'
      }}
    >
      {isLiked ? '❤️' : '🤍'} {likesCount}
    </button>
  );
};

export default LikeButton;
