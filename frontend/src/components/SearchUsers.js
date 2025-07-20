import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import FollowButton from './FollowButton';

const SearchUsers = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [followStatus, setFollowStatus] = useState({});
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Debounced search effect
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Filter ra chính mình
        const otherUsers = res.data.filter(user => user.id !== currentUser?.id);
        setSearchResults(otherUsers);
        setShowResults(true);

        // Lấy follow status cho users tìm được
        if (otherUsers.length > 0) {
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
        }

      } catch (err) {
        console.error('Error searching users:', err);
      } finally {
        setLoading(false);
      }
    };

    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setSearchResults([]);
        setShowResults(false);
      }
    }, 300); // Delay 300ms để tránh spam API

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, currentUser?.id]);

  const handleInputFocus = () => {
    if (searchResults.length > 0) {
      setShowResults(true);
    }
  };

  const handleInputBlur = () => {
    // Delay để cho phép click vào kết quả
    setTimeout(() => setShowResults(false), 200);
  };

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 400 }}>
      {/* Search Input */}
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          placeholder="🔍 Tìm kiếm người dùng..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          style={{
            width: '100%',
            padding: '12px 16px',
            border: '1px solid #e1e8ed',
            borderRadius: 20,
            fontSize: 14,
            outline: 'none',
            backgroundColor: '#f7f9fa',
            transition: 'all 0.2s ease'
          }}
        />
        {loading && (
          <div style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            fontSize: 12,
            color: '#657786'
          }}>
            Đang tìm...
          </div>
        )}
      </div>

      {/* Search Results */}
      {showResults && searchResults.length > 0 && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e1e8ed',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          maxHeight: 300,
          overflowY: 'auto',
          marginTop: 4
        }}>
          {searchResults.map((user) => {
            const status = followStatus[user.id] || {};
            return (
              <div key={user.id} style={{
                padding: 12,
                borderBottom: '1px solid #f7f9fa',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background-color 0.2s ease'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#f7f9fa'}
              onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                <Link 
                  to={`/profile/${user.id}`}
                  style={{ 
                    textDecoration: 'none', 
                    color: 'inherit',
                    display: 'flex',
                    alignItems: 'center',
                    flex: 1
                  }}
                  onClick={() => setShowResults(false)}
                >
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
                    fontSize: 14,
                    fontWeight: 'bold'
                  }}>
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', fontSize: 14 }}>{user.name}</div>
                    <div style={{ fontSize: 12, color: '#657786' }}>{user.email}</div>
                    <div style={{ fontSize: 11, color: '#8899a6' }}>
                      {status.followers_count || 0} followers
                    </div>
                  </div>
                </Link>
                
                <div onClick={(e) => e.preventDefault()}>
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
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* No Results */}
      {showResults && searchQuery.trim().length > 0 && searchResults.length === 0 && !loading && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #e1e8ed',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          zIndex: 1000,
          padding: 16,
          textAlign: 'center',
          color: '#657786',
          fontSize: 14,
          marginTop: 4
        }}>
          Không tìm thấy người dùng nào
        </div>
      )}
    </div>
  );
};

export default SearchUsers;
