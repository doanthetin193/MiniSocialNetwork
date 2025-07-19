import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import FollowButton from '../components/FollowButton';

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
        
        console.log('Fetching profile for userId:', userId);
        
        // Lấy thông tin user
        const userRes = await axios.get(`http://localhost:5000/api/users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('All users:', userRes.data);
        
        const targetUser = userRes.data.find(u => u.id === parseInt(userId));
        console.log('Target user found:', targetUser);
        
        if (!targetUser) {
          console.error('User not found with id:', userId);
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
        console.error('Error fetching profile:', err);
        console.error('Error details:', err.response?.data);
        console.error('Error status:', err.response?.status);
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
      console.error('Error fetching followers:', err);
    }
  };

  const fetchFollowing = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/users/${userId}/following`);
      setFollowing(res.data);
      setActiveTab('following');
    } catch (err) {
      console.error('Error fetching following:', err);
    }
  };

  if (!user) {
    return (
      <div style={{ textAlign: 'center', padding: 20 }}>
        <p>Loading...</p>
        <p style={{ fontSize: 12, color: '#657786' }}>
          Debug: userId = {userId}, currentUser = {currentUser?.name}
        </p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      {/* Header Profile */}
      <div style={{ 
        textAlign: 'center', 
        padding: 20, 
        border: '1px solid #e1e8ed', 
        borderRadius: 8,
        marginBottom: 20
      }}>
        <div style={{ 
          width: 80, 
          height: 80, 
          borderRadius: '50%', 
          backgroundColor: '#1da1f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px',
          fontSize: 24,
          color: 'white'
        }}>
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
          ) : (
            user.name.charAt(0).toUpperCase()
          )}
        </div>
        
        <h2 style={{ margin: 0, marginBottom: 8 }}>{user.name}</h2>
        <p style={{ margin: 0, color: '#657786', marginBottom: 16 }}>{user.email}</p>
        
        <div style={{ display: 'flex', justifyContent: 'center', gap: 24, marginBottom: 16 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{posts.length}</div>
            <div style={{ fontSize: 12, color: '#657786' }}>Bài viết</div>
          </div>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={fetchFollowers}>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{followStatus.followers_count || 0}</div>
            <div style={{ fontSize: 12, color: '#657786' }}>Followers</div>
          </div>
          <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={fetchFollowing}>
            <div style={{ fontSize: 18, fontWeight: 'bold' }}>{followStatus.following_count || 0}</div>
            <div style={{ fontSize: 12, color: '#657786' }}>Following</div>
          </div>
        </div>

        {!isOwnProfile && currentUser && (
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
        )}
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: '1px solid #e1e8ed', marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 0 }}>
          <button
            onClick={() => setActiveTab('posts')}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'posts' ? '2px solid #1da1f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'posts' ? 'bold' : 'normal'
            }}
          >
            Bài viết
          </button>
          <button
            onClick={fetchFollowers}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'followers' ? '2px solid #1da1f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'followers' ? 'bold' : 'normal'
            }}
          >
            Followers
          </button>
          <button
            onClick={fetchFollowing}
            style={{
              padding: '12px 16px',
              border: 'none',
              borderBottom: activeTab === 'following' ? '2px solid #1da1f2' : '2px solid transparent',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              fontWeight: activeTab === 'following' ? 'bold' : 'normal'
            }}
          >
            Following
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'posts' && (
        <div>
          {posts.map((post) => (
            <div key={post.id} style={{ border: '1px solid #e1e8ed', borderRadius: 8, padding: 16, marginBottom: 12 }}>
              <p>{post.content}</p>
              {post.image_url && <img src={post.image_url} alt="Post" style={{ maxWidth: '100%' }} />}
              <p style={{ fontSize: 12, color: '#657786', marginTop: 12 }}>
                ❤️ {post.likes_count || 0} • {new Date(post.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
          {posts.length === 0 && (
            <p style={{ textAlign: 'center', color: '#657786' }}>Chưa có bài viết nào</p>
          )}
        </div>
      )}

      {activeTab === 'followers' && (
        <div>
          {followers.map((follower) => (
            <div key={follower.user_id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: 12, 
              border: '1px solid #e1e8ed', 
              borderRadius: 8, 
              marginBottom: 8 
            }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                backgroundColor: '#1da1f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                color: 'white',
                fontSize: 14
              }}>
                {follower.avatar_url ? (
                  <img src={follower.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  follower.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{follower.name}</div>
                <div style={{ fontSize: 12, color: '#657786' }}>{follower.email}</div>
              </div>
            </div>
          ))}
          {followers.length === 0 && (
            <p style={{ textAlign: 'center', color: '#657786' }}>Chưa có followers</p>
          )}
        </div>
      )}

      {activeTab === 'following' && (
        <div>
          {following.map((user) => (
            <div key={user.user_id} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              padding: 12, 
              border: '1px solid #e1e8ed', 
              borderRadius: 8, 
              marginBottom: 8 
            }}>
              <div style={{ 
                width: 40, 
                height: 40, 
                borderRadius: '50%', 
                backgroundColor: '#1da1f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 12,
                color: 'white',
                fontSize: 14
              }}>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <div style={{ fontWeight: 'bold' }}>{user.name}</div>
                <div style={{ fontSize: 12, color: '#657786' }}>{user.email}</div>
              </div>
            </div>
          ))}
          {following.length === 0 && (
            <p style={{ textAlign: 'center', color: '#657786' }}>Chưa follow ai</p>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
