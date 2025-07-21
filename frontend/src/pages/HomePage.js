import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from './HomePage.module.css';

const HomePage = () => {
  const [posts, setPosts] = useState([]);
  const [expandedPostId, setExpandedPostId] = useState(null);
  const [comments, setComments] = useState({});
  const [newComment, setNewComment] = useState({});
  const [likedPosts, setLikedPosts] = useState(new Set()); // Track liked posts
  const [friends, setFriends] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [followingSet, setFollowingSet] = useState(new Set());
  const [userStats, setUserStats] = useState({ posts: 0, following: 0, followers: 0 });
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch posts
        const postsRes = await axios.get('http://localhost:5000/api/posts');
        setPosts(postsRes.data);

        if (token) {
          // Fetch like status for posts
          const likedSet = new Set();
          for (const post of postsRes.data) {
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

          // Fetch friends and following status - TEMPORARILY DISABLED
          // TODO: Enable when backend endpoints are available
          /*
          try {
            const followingRes = await axios.get('http://localhost:5000/api/users/following', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setFriends(followingRes.data);
            const followingIds = new Set(followingRes.data.map(user => user.id));
            setFollowingSet(followingIds);
          } catch (err) {
            console.error('Error fetching following:', err);
          }
          */

          // Fetch suggested users
          try {
            const usersRes = await axios.get('http://localhost:5000/api/users', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setSuggestedUsers(usersRes.data.slice(0, 5)); // Show only 5 suggestions
          } catch (err) {
            console.error('Error fetching users:', err);
          }

          // Fetch user stats - TEMPORARILY DISABLED
          // TODO: Enable when backend endpoint is available  
          /*
          try {
            const statsRes = await axios.get('http://localhost:5000/api/users/stats', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setUserStats(statsRes.data);
          } catch (err) {
            console.error('Error fetching stats:', err);
            // Set default stats if API doesn't exist
            setUserStats({ 
              posts: postsRes.data.filter(p => p.user_id === JSON.parse(atob(token.split('.')[1])).userId).length, 
              following: 0, 
              followers: 0 
            });
          }
          */
          
          // Set default stats since backend endpoint not available
          setUserStats({ 
            posts: postsRes.data.filter(p => p.user_id === JSON.parse(atob(token.split('.')[1])).userId).length, 
            following: 0, 
            followers: 0 
          });
        }
      } catch (err) {
        console.error('Error fetching data:', err);
      }
    };

    fetchData();
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

  // Hàm xử lý follow/unfollow
  const handleFollowToggle = async (userId) => {
    if (!token) return alert('Bạn cần đăng nhập để theo dõi');

    try {
      const res = await axios.post(`http://localhost:5000/api/users/${userId}/follow`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const newFollowingSet = new Set(followingSet);
      if (res.data.following) {
        newFollowingSet.add(userId);
        // Add to friends list if not already there
        const userToAdd = suggestedUsers.find(u => u.id === userId);
        if (userToAdd && !friends.find(f => f.id === userId)) {
          setFriends([...friends, userToAdd]);
        }
      } else {
        newFollowingSet.delete(userId);
        // Remove from friends list
        setFriends(friends.filter(f => f.id !== userId));
      }
      setFollowingSet(newFollowingSet);

    } catch (err) {
      console.error('Error toggling follow:', err);
      alert('Lỗi khi theo dõi người dùng');
    }
  };

  return (
    <div className={styles.container}>
      {/* Main Content */}
      <div className={styles.mainContent}>
        {/* Header bỏ trống hoặc border-bottom nhẹ nếu muốn */}
        <div className={styles.header}></div>
        {/* Nút tạo bài viết mới đặt trên danh sách bài viết */}
        <div className={styles.createPostWrapper}>
          <button onClick={() => navigate('/create-post')} className={styles.createPostButton}>
            Bạn đang nghĩ gì?
          </button>
        </div>
        {/* Posts */}
        <div className={styles.postsWrapper}>
          {posts.map((post) => (
            <div key={post.id} className={styles.postCard}>
              <div className={styles.postHeader}>
                <div className={styles.userInfo}>
                  <Link to={`/profile/${post.user_id}`} className={styles.userName}>
                    {post.name}
                  </Link>
                  <span className={styles.userEmail}>({post.email})</span>
                </div>
              </div>
              
              <div className={styles.postContent}>{post.content}</div>
              
              {post.image_url && (
                <img src={post.image_url} alt="Post" className={styles.postImage} />
              )}
              
              <div className={styles.postDate}>
                {new Date(post.created_at).toLocaleString()}
              </div>

              {/* Like Button và số lượt like */}
              <div className={styles.interactionBar}>
                <button 
                  onClick={() => handleLikeToggle(post.id)}
                  className={`${styles.likeButton} ${likedPosts.has(post.id) ? styles.liked : styles.notLiked}`}
                >
                  {likedPosts.has(post.id) ? '❤️' : '🤍'} {post.likes_count || 0}
                </button>

                <button 
                  onClick={() => toggleComments(post.id)} 
                  className={styles.commentButton}
                >
                  💬 {expandedPostId === post.id ? 'Ẩn bình luận' : 'Xem bình luận'}
                </button>
              </div>

              {expandedPostId === post.id && (
                <div className={styles.commentsSection}>
                  <h4 className={styles.commentsTitle}>Bình luận</h4>
                  {comments[post.id]?.map((cmt) => (
                    <div key={cmt.id} className={styles.commentItem}>
                      <span className={styles.commentAuthor}>{cmt.name}:</span>
                      <span className={styles.commentContent}>{cmt.content}</span>
                    </div>
                  ))}

                  {token && (
                    <div className={styles.commentInputSection}>
                      <input
                        value={newComment[post.id] || ''}
                        onChange={(e) =>
                          setNewComment((prev) => ({ ...prev, [post.id]: e.target.value }))
                        }
                        placeholder="Nhập bình luận..."
                        className={styles.commentInput}
                      />
                      <button 
                        onClick={() => handleCommentSubmit(post.id)} 
                        className={styles.commentSubmitButton}
                      >
                        Gửi
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      {/* Sidebar */}
      {token && (
        <div className={styles.sidebar}>
          {/* Suggested Users only, sticky */}
          {suggestedUsers.length > 0 && (
            <div className={styles.sidebarCard + ' ' + styles.stickyCard}>
              <h3 className={styles.sidebarTitle}>✨ Gợi ý kết bạn</h3>
              <ul className={styles.friendsList}>
                {suggestedUsers.map((user) => (
                  <li key={user.id} className={styles.friendItem}>
                    <div className={styles.friendAvatar}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.friendInfo}>
                      <div className={styles.friendName} title={user.name}>
                        {user.name}
                      </div>
                      <div className={styles.friendEmail} title={user.email}>
                        {user.email}
                      </div>
                    </div>
                    <button
                      onClick={() => handleFollowToggle(user.id)}
                      className={`${styles.followButton} ${followingSet.has(user.id) ? styles.following : ''}`}
                    >
                      {followingSet.has(user.id) ? 'Đang theo dõi' : 'Theo dõi'}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default HomePage;
