import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './MyPostsPage.module.css';

const MyPostsPage = () => {
  const [posts, setPosts] = useState([]);
  const [editingPost, setEditingPost] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [editImage, setEditImage] = useState(null);
  const [likedPosts, setLikedPosts] = useState(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMyPosts = async () => {
      setIsLoading(true);
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
        // ...existing code...
      } finally {
        setIsLoading(false);
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
      // ...existing code...
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
    setIsSaving(true);
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
      // ...existing code...
      alert('Lỗi khi cập nhật bài viết!');
    } finally {
      setIsSaving(false);
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
      // ...existing code...
      alert('Lỗi khi thích bài viết');
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>📝 Bài viết của tôi</h1>
        <p className={styles.subtitle}>Quản lý và chỉnh sửa các bài viết của bạn</p>
        {!isLoading && (
          <div className={styles.postsCount}>
            {posts.length} bài viết
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && posts.length === 0 && (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3 className={styles.emptyTitle}>Chưa có bài viết nào</h3>
          <p className={styles.emptyText}>
            Bạn chưa đăng bài viết nào. Hãy tạo bài viết đầu tiên để chia sẻ với mọi người!
          </p>
          <Link to="/create-post" className={styles.createFirstPostButton}>
            ✏️ Tạo bài viết đầu tiên
          </Link>
        </div>
      )}

      {/* Posts List */}
      {!isLoading && posts.map((post) => (
        <div 
          key={post.id} 
          className={`${styles.postCard} ${editingPost === post.id ? styles.editing : ''}`}
        >
          {editingPost === post.id ? (
            // Form chỉnh sửa
            <div className={styles.editForm}>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={styles.editTextarea}
                placeholder="Nội dung bài viết..."
                rows={4}
              />
              
              <div className={styles.fileInput}>
                <label className={styles.fileInputLabel}>
                  <input
                    type="file"
                    onChange={(e) => setEditImage(e.target.files[0])}
                    accept="image/*"
                    className={styles.fileInputHidden}
                  />
                  <span className={styles.fileInputText}>
                    📷 {editImage ? editImage.name : 'Chọn ảnh mới (tùy chọn)'}
                  </span>
                </label>
              </div>

              <div className={styles.editActions}>
                <button 
                  onClick={() => handleEditSave(post.id)}
                  className={styles.saveButton}
                  disabled={isSaving}
                >
                  {isSaving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
                </button>
                <button 
                  onClick={handleEditCancel}
                  className={styles.cancelButton}
                  disabled={isSaving}
                >
                  ❌ Hủy bỏ
                </button>
              </div>
            </div>
          ) : (
            // Hiển thị bài viết bình thường
            <>
              <div className={styles.postContent}>{post.content}</div>
              
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  className={styles.postImage}
                />
              )}
              
              <div className={styles.postDate}>
                🕒 {new Date(post.created_at).toLocaleString('vi-VN')}
              </div>

              <div className={styles.interactionBar}>
                <div className={styles.likeSection}>
                  <button 
                    onClick={() => handleLikeToggle(post.id)}
                    className={`${styles.likeButton} ${likedPosts.has(post.id) ? styles.liked : styles.notLiked}`}
                  >
                    {likedPosts.has(post.id) ? '❤️' : '🤍'} {post.likes_count || 0} lượt thích
                  </button>
                </div>

                <div className={styles.actions}>
                  <button 
                    onClick={() => handleEditStart(post)}
                    className={styles.editButton}
                  >
                    ✏️ Chỉnh sửa
                  </button>
                  <button 
                    onClick={() => handleDeletePost(post.id)}
                    className={styles.deleteButton}
                  >
                    🗑️ Xóa bài
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default MyPostsPage;
