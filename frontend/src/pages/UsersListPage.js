import { useEffect, useState } from 'react';
import axios from 'axios';
import FollowButton from '../components/FollowButton';

const UsersListPage = () => {
  const [users, setUsers] = useState([]);
  const [followStatus, setFollowStatus] = useState({}); // userId -> {isFollowing, followersCount}
  const currentUser = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter ra chính mình
        const otherUsers = res.data.filter(user => user.id !== currentUser?.id);
        setUsers(otherUsers);

        // Lấy trạng thái follow cho từng user
        const statusPromises = otherUsers.map(async (user) => {
          try {
            const statusRes = await axios.get(`http://localhost:5000/api/users/${user.id}/follow-status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            return {
              userId: user.id,
              ...statusRes.data
            };
          } catch (err) {
            return {
              userId: user.id,
              followers_count: 0,
              following_count: 0,
              is_following: false
            };
          }
        });

        const statusResults = await Promise.all(statusPromises);
        const statusMap = {};
        statusResults.forEach(status => {
          statusMap[status.userId] = status;
        });
        setFollowStatus(statusMap);

      } catch (err) {
        // ...existing code...
      }
    };

    fetchUsers();
  }, [currentUser?.id]);

  return (
    <div style={{ maxWidth: 600, margin: 'auto', padding: 20 }}>
      <h2>👥 Danh sách người dùng</h2>
      
      {users.map((user) => {
        const status = followStatus[user.id] || {};
        return (
          <div key={user.id} style={{ 
            border: '1px solid #e1e8ed', 
            borderRadius: 8, 
            padding: 16, 
            marginBottom: 12,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ margin: 0, marginBottom: 4 }}>{user.name}</h4>
              <p style={{ margin: 0, color: '#657786', fontSize: 14 }}>{user.email}</p>
              <p style={{ margin: 0, marginTop: 8, fontSize: 12, color: '#8899a6' }}>
                <span style={{ marginRight: 16 }}>
                  👥 {status.followers_count || 0} followers
                </span>
                <span>
                  ➡️ {status.following_count || 0} following
                </span>
              </p>
            </div>
            
            {currentUser && currentUser.id !== user.id && (
              <FollowButton 
                userId={user.id}
                initialIsFollowing={status.is_following}
                onFollowUpdate={(userId, isFollowing) => {
                  setFollowStatus(prev => ({
                    ...prev,
                    [userId]: {
                      ...prev[userId],
                      is_following: isFollowing,
                      followers_count: isFollowing ? 
                        (prev[userId]?.followers_count || 0) + 1 : 
                        (prev[userId]?.followers_count || 1) - 1
                    }
                  }));
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default UsersListPage;
