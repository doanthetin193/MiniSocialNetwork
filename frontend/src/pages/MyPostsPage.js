import { useEffect, useState } from 'react';
import axios from 'axios';

const MyPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/posts/mine', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Cập nhật posts với likes_count
        const postsWithLikes = await Promise.all(
          res.data.map(async (post) => {
            try {
              const likeRes = await axios.get(`http://localhost:5000/api/posts/${post.id}/like-status`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              return {
                ...post,
                likes_count: likeRes.data.likes_count,
                is_liked: likeRes.data.is_liked
              };
            } catch (err) {
              return { ...post, likes_count: 0, is_liked: false };
            }
          })
        );

        setPosts(postsWithLikes);

        // Set liked posts
        const likedSet = new Set();
        postsWithLikes.forEach(post => {
          if (post.is_liked) likedSet.add(post.id);
        });
        setLikedPosts(likedSet);

      } catch (err) {
        console.error('Error fetching my posts:', err);
      }
    };

    fetchMyPosts();
  }, []);

  // Hàm xóa bài viết
  const handleDeletePost = async (postId) => {
    if (!window.confirm('Bạn có chắc muốn xóa bài viết này?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/posts/${postId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Cập nhật danh sách posts sau khi xóa
      setPosts(posts.filter(post => post.id !== postId));
      alert('Xóa bài viết thành công!');
    } catch (err) {
      console.error('Error deleting post:', err);
      alert('Lỗi khi xóa bài viết!');
    }
  };

  // Hàm bắt đầu chỉnh sửa
  const handleEditStart = (post) => {
    setEditingPost(post.id);
    setEditContent(post.content);
    setEditImage(null);
  };

  // Hàm hủy chỉnh sửa
  const handleEditCancel = () => {
    setEditingPost(null);
    setEditContent('');
    setEditImage(null);
  };

  // Hàm lưu chỉnh sửa
  const handleEditSave = async (postId) => {
    try {
      let imageUrl = '';

      // Nếu có ảnh mới được chọn
      if (editImage) {
        const formData = new FormData();
        formData.append('image', editImage);

        const uploadRes = await axios.post('http://localhost:5000/api/upload/image', formData, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        imageUrl = uploadRes.data.image_url;
      }

      // Cập nhật bài viết
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:5000/api/posts/${postId}`, {
        content: editContent,
        image_url: imageUrl || posts.find(p => p.id === postId).image_url
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Cập nhật local state
      setPosts(posts.map(post => 
        post.id === postId 
          ? { ...post, content: editContent, image_url: imageUrl || post.image_url }
          : post
      ));

      // Reset form
      handleEditCancel();
      alert('Cập nhật bài viết thành công!');
    } catch (err) {
      console.error('Error updating post:', err);
      alert('Lỗi khi cập nhật bài viết!');
    }
  };

  // Hàm xử lý like/unlike
  const handleLikeToggle = async (postId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5000/api/posts/${postId}/like`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Cập nhật trạng thái liked
      const newLikedPosts = new Set(likedPosts);
      if (res.data.liked) {
        newLikedPosts.add(postId);
      } else {
        newLikedPosts.delete(postId);
      }
      setLikedPosts(newLikedPosts);

      // Cập nhật likes_count trong posts
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes_count: res.data.liked 
                ? parseInt(post.likes_count || 0) + 1 
                : parseInt(post.likes_count || 0) - 1 
            }
          : post
      ));

    } catch (err) {
      console.error('Error toggling like:', err);
      alert('Lỗi khi thích bài viết');
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>Bài viết của tôi</h2>
      {posts.map((post) => (
        <div key={post.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
          {editingPost === post.id ? (
            // Form chỉnh sửa
            <div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={4}
                style={{ width: '100%', marginBottom: 10 }}
                placeholder="Nội dung bài viết..."
              />
              <input
                type="file"
                onChange={(e) => setEditImage(e.target.files[0])}
                accept="image/*"
                style={{ marginBottom: 10 }}
              />
              <div>
                <button 
                  onClick={() => handleEditSave(post.id)}
                  style={{ 
                    marginRight: 10, 
                    backgroundColor: '#4CAF50', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  💾 Lưu
                </button>
                <button 
                  onClick={handleEditCancel}
                  style={{ 
                    backgroundColor: '#f44336', 
                    color: 'white', 
                    border: 'none', 
                    padding: '8px 16px', 
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  ❌ Hủy
                </button>
              </div>
            </div>
          ) : (
            // Hiển thị bài viết bình thường
            <div>
              <p>{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="Post" style={{ maxWidth: '100%' }} />}
              <p style={{ fontSize: 12, color: 'gray' }}>{new Date(post.created_at).toLocaleString()}</p>
              
              {/* Like Button */}
              <div style={{ marginTop: 10, marginBottom: 10 }}>
                <button 
                  onClick={() => handleLikeToggle(post.id)}
                  style={{ 
                    backgroundColor: likedPosts.has(post.id) ? '#ff4757' : '#f1f2f6',
                    color: likedPosts.has(post.id) ? 'white' : '#2f3640',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginRight: '10px'
                  }}
                >
                  {likedPosts.has(post.id) ? '❤️' : '🤍'} {post.likes_count || 0}
                </button>
              </div>

              {/* Buttons Sửa và Xóa */}
              <div style={{ marginTop: 10 }}>
                <button 
                  onClick={() => handleEditStart(post)}
                  style={{ 
                    marginRight: 10, 
                    backgroundColor: '#2196F3', 
                    color: 'white', 
                    border: 'none', 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  ✏️ Sửa
                </button>
                <button 
                  onClick={() => handleDeletePost(post.id)}
                  style={{ 
                    backgroundColor: '#f44336', 
                    color: 'white', 
                    border: 'none', 
                    padding: '6px 12px', 
                    cursor: 'pointer',
                    borderRadius: '4px'
                  }}
                >
                  🗑️ Xóa
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyPostsPage;
