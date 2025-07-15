import { useEffect, useState } from 'react';
import axios from 'axios';

const MyPostsPage = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const fetchMyPosts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/posts/mine', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setPosts(res.data);
      } catch (err) {
        console.error('Error fetching my posts:', err);
      }
    };

    fetchMyPosts();
  }, []);

  return (
    <div style={{ maxWidth: 600, margin: 'auto' }}>
      <h2>Bài viết của tôi</h2>
      {posts.map((post) => (
        <div key={post.id} style={{ border: '1px solid #ccc', padding: 12, marginBottom: 16 }}>
          <p>{post.content}</p>
          {post.image_url && <img src={post.image_url} alt="Post" style={{ maxWidth: '100%' }} />}
          <p style={{ fontSize: 12, color: 'gray' }}>{new Date(post.created_at).toLocaleString()}</p>
        </div>
      ))}
    </div>
  );
};

export default MyPostsPage;
