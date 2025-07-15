import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/posts');
        setPosts(res.data);
      } catch (err) {
        console.error('Error fetching posts:', err);
      }
    };

    fetchPosts();
  }, []);

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

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>Tất cả bài viết</h2>
      <Link to="/myposts">Xem bài viết của tôi</Link>

      <button onClick={() => navigate('/create-post')} style={{ marginBottom: 20 }}>
        ➕ Tạo bài viết
      </button>

      {posts.map((post) => (
        <div key={post.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
          <p><strong>{post.name}</strong> ({post.email})</p>
          <p>{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="Post" style={{ maxWidth: '100%' }} />}
          <p style={{ fontSize: 12, color: 'gray' }}>{new Date(post.created_at).toLocaleString()}</p>

          <button onClick={() => toggleComments(post.id)} style={{ marginTop: 10 }}>
            {expandedPostId === post.id ? 'Ẩn bình luận' : 'Xem bình luận'}
          </button>

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
