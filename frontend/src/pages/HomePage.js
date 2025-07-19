import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set()); // Track liked posts
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/posts');
        setPosts(res.data);

        // Nếu đã đăng nhập, lấy trạng thái like của từng post
        if (token) {
          const likedSet = new Set();
          for (const post of res.data) {
            try {
              const likeRes = await axios.get(`http://localhost:5000/api/posts/${post.id}/like-status`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              if (likeRes.data.is_liked) {
                likedSet.add(post.id);
              }
            } catch (err) {
              console.error('Error fetching like status:', err);
            }
          }
          setLikedPosts(likedSet);
        }
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };

    fetchPosts();
  }, [token]);

  const toggleComments = async (postId) => {
    if (expandedPostId === postId) {
      setExpandedPostId(null);
      return;
    }

    try {
      const res = await axios.get(`http://localhost:5000/api/posts/${postId}/comments`);
      setComments((prev) => ({ ...prev, [postId]: res.data }));
      setExpandedPostId(postId);
    } catch (err) {
      console.error('Error fetching comments:', err);
    }
  };

  const handleCommentSubmit = async (postId) => {
    if (!token) return alert('Bạn cần đăng nhập để bình luận');

    try {
      await axios.post(
        `http://localhost:5000/api/posts/${postId}/comments`,
        { content: newComment[postId] || '' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewComment((prev) => ({ ...prev, [postId]: '' }));
      toggleComments(postId); // reload comment
    } catch (err) {
      console.error('Error posting comment:', err);
    }
  };

  // Hàm xử lý like/unlike
  const handleLikeToggle = async (postId) => {
    if (!token) return alert('Bạn cần đăng nhập để thích bài viết');

    try {
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
                ? parseInt(post.likes_count) + 1 
                : parseInt(post.likes_count) - 1 
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
      <h2>Tất cả bài viết</h2>
      <Link to="/myposts">Xem bài viết của tôi</Link>

      <button onClick={() => navigate('/create-post')} style={{ marginBottom: 20 }}>
        ➕ Tạo bài viết
      </button>

      {posts.map((post) => (
        <div key={post.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
          <p>
            <Link to={`/profile/${post.user_id}`} style={{ textDecoration: 'none', color: '#1da1f2', fontWeight: 'bold' }}>
              {post.name}
            </Link>
            {' '}({post.email})
          </p>
          <p>{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="Post" style={{ maxWidth: '100%' }} />}
          <p style={{ fontSize: 12, color: 'gray' }}>{new Date(post.created_at).toLocaleString()}</p>

          {/* Like Button và số lượt like */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 10 }}>
            <button 
              onClick={() => handleLikeToggle(post.id)}
              style={{ 
                backgroundColor: likedPosts.has(post.id) ? '#ff4757' : '#f1f2f6',
                color: likedPosts.has(post.id) ? 'white' : '#2f3640',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '20px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              {likedPosts.has(post.id) ? '❤️' : '🤍'} {post.likes_count || 0}
            </button>

            <button onClick={() => toggleComments(post.id)} style={{ 
              backgroundColor: '#f1f2f6',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px'
            }}>
              💬 {expandedPostId === post.id ? 'Ẩn bình luận' : 'Xem bình luận'}
            </button>
          </div>

          {expandedPostId === post.id && (
            <div style={{ marginTop: 10 }}>
              <h4>Bình luận</h4>
              {comments[post.id]?.map((cmt) => (
                <div key={cmt.id} style={{ borderTop: '1px solid #eee', padding: 4 }}>
                  <strong>{cmt.name}</strong>: {cmt.content}
                </div>
              ))}

              {token && (
                <div style={{ marginTop: 10 }}>
                  <input
                    value={newComment[post.id] || ''}
                    onChange={(e) =>
                      setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Nhập bình luận..."
                    style={{ width: '100%', padding: 6 }}
                  />
                  <button onClick={() => handleCommentSubmit(post.id)} style={{ marginTop: 4 }}>
                    Gửi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default HomePage;
