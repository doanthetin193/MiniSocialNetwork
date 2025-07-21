import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import FollowButton from '../components/FollowButton';
import styles from './ProfilePage.module.css';

const ProfilePage = () => {
  const { userId } = useParams();
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [activeTab, setActiveTab] = useState('posts'); // posts, followers, following
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const isOwnProfile = currentUser && currentUser.id === parseInt(userId);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        // Kiểm tra có token và userId không
        if (!token || !userId) {
          console.error('Missing token or userId');
          return;
        }
        // Lấy thông tin user
        const userRes = await axios.get(`http://localhost:5000/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const targetUser = userRes.data.find(u => u.id === parseInt(userId));
        if (!targetUser) {
          console.error('User not found với id:', userId);
          return;
        }
        setUser(targetUser);
        // Lấy posts của user này
        const postsRes = await axios.get('http://localhost:5000/api/posts');
        const userPosts = postsRes.data.filter(post => post.user_id === parseInt(userId));
        setPosts(userPosts);
        // Lấy trạng thái follow (nếu không phải profile của mình)
        if (!isOwnProfile && token) {
          const statusRes = await axios.get(`http://localhost:5000/api/users/${userId}/follow-status`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setFollowStatus(statusRes.data);
        }
      } catch (err) {
        console.error('Lỗi lấy thông tin profile:', err);
      }
    };

    if (userId) {
      fetchUserProfile();
    }
  }, [userId, isOwnProfile]);

  const fetchFollowers = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${userId}/followers`);
      setFollowers(res.data);
      setActiveTab('followers');
    } catch (err) {
      console.error('Lỗi lấy followers:', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${userId}/following`);
      setFollowing(res.data);
      setActiveTab('following');
    } catch (err) {
      console.error('Lỗi lấy following:', err);
    }
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <div className={styles.loadingText}>Đang tải thông tin người dùng...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header Profile */}
      <div className={styles.profileHeader}>
        <div className={styles.coverPhoto}></div>
        <div className={styles.avatarContainer}>
          <div className={styles.avatar}>
            {user.avatar_url ? (
              <img src={user.avatar_url} alt="Avatar" className={styles.avatarImage} />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
        </div>
        
        <h2 className={styles.userName}>{user.name}</h2>
        <p className={styles.userEmail}>{user.email}</p>
        
        <div className={styles.stats}>
          <div className={styles.statItem} onClick={() => setActiveTab('posts')}>
            <div className={styles.statNumber}>{posts.length}</div>
            <div className={styles.statLabel}>Bài viết</div>
          </div>
          <div className={styles.statItem} onClick={fetchFollowers}>
            <div className={styles.statNumber}>{followStatus.followers_count || 0}</div>
            <div className={styles.statLabel}>Followers</div>
          </div>
          <div className={styles.statItem} onClick={fetchFollowing}>
            <div className={styles.statNumber}>{followStatus.following_count || 0}</div>
            <div className={styles.statLabel}>Following</div>
          </div>
        </div>

        {!isOwnProfile && currentUser && (
          <div className={styles.followSection}>
            <FollowButton 
              userId={parseInt(userId)}
              initialIsFollowing={followStatus.is_following}
              onFollowUpdate={(userId, isFollowing) => {
                setFollowStatus(prev => ({
                  ...prev,
                is_following: isFollowing,
                followers_count: isFollowing ? 
                  (prev.followers_count || 0) + 1 : 
                  (prev.followers_count || 1) - 1
              }));
            }}
          />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabsContainer}>
        <div className={styles.tabsNav}>
          <button
            onClick={() => setActiveTab('posts')}
            className={`${styles.tabButton} ${activeTab === 'posts' ? styles.active : ''}`}
          >
            📝 Bài viết
          </button>
          <button
            onClick={fetchFollowers}
            className={`${styles.tabButton} ${activeTab === 'followers' ? styles.active : ''}`}
          >
            👥 Followers
          </button>
          <button
            onClick={fetchFollowing}
            className={`${styles.tabButton} ${activeTab === 'following' ? styles.active : ''}`}
          >
            🔔 Following
          </button>
        </div>
      </div>

      {/* Content */}
      <div className={styles.contentSection}>
        {activeTab === 'posts' && (
          <div>
            {posts.length > 0 ? (
              <div className={styles.postsGrid}>
                {posts.map((post) => (
                  <div key={post.id} className={styles.postCard}>
                    <div className={styles.postContent}>{post.content}</div>
                    {post.image_url && (
                      <img src={post.image_url} alt="Post" className={styles.postImage} />
                    )}
                    <div className={styles.postMeta}>
                      <div className={styles.postLikes}>
                        ❤️ {post.likes_count || 0}
                      </div>
                      <div className={styles.postDate}>
                        📅 {new Date(post.created_at).toLocaleDateString('vi-VN')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📝</div>
                <div className={styles.emptyTitle}>Chưa có bài viết nào</div>
                <div className={styles.emptyText}>
                  {isOwnProfile ? 
                    'Hãy tạo bài viết đầu tiên của bạn!' : 
                    'Người dùng này chưa chia sẻ bài viết nào.'}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div>
            {followers.length > 0 ? (
              <div className={styles.userList}>
                {followers.map((follower) => (
                  <div key={follower.user_id} className={styles.userCard}>
                    <div className={styles.userAvatar}>
                      {follower.avatar_url ? (
                        <img src={follower.avatar_url} alt="Avatar" className={styles.userAvatarImage} />
                      ) : (
                        follower.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userInfoName}>{follower.name}</div>
                      <div className={styles.userInfoEmail}>{follower.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>👥</div>
                <div className={styles.emptyTitle}>Chưa có followers</div>
                <div className={styles.emptyText}>
                  {isOwnProfile ? 
                    'Chưa có ai theo dõi bạn.' : 
                    'Người dùng này chưa có followers.'}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div>
            {following.length > 0 ? (
              <div className={styles.userList}>
                {following.map((user) => (
                  <div key={user.user_id} className={styles.userCard}>
                    <div className={styles.userAvatar}>
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Avatar" className={styles.userAvatarImage} />
                      ) : (
                        user.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className={styles.userInfo}>
                      <div className={styles.userInfoName}>{user.name}</div>
                      <div className={styles.userInfoEmail}>{user.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🔔</div>
                <div className={styles.emptyTitle}>Chưa follow ai</div>
                <div className={styles.emptyText}>
                  {isOwnProfile ? 
                    'Hãy tìm và theo dõi những người bạn quan tâm!' : 
                    'Người dùng này chưa theo dõi ai.'}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProfilePage;
