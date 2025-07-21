import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import LikeButton from './LikeButton';

const SearchPosts = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [authorFilter, setAuthorFilter] = useState('');
  const [dateFromFilter, setDateFromFilter] = useState('');
  const [dateToFilter, setDateToFilter] = useState('');
  const [searchResults, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const performSearch = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (searchQuery.trim()) params.append('q', searchQuery.trim());
        if (authorFilter.trim()) params.append('author', authorFilter.trim());
        if (dateFromFilter) params.append('date_from', dateFromFilter);
        if (dateToFilter) params.append('date_to', dateToFilter);

        const res = await axios.get(`http://localhost:5000/api/posts/search?${params.toString()}`);
        setPosts(res.data);
      } catch (err) {
        // ...existing code...
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };

    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length > 0) {
        performSearch();
      } else {
        setPosts([]);
      }
    }, 500); // Delay 500ms cho search posts

    return () => clearTimeout(delayedSearch);
  }, [searchQuery, authorFilter, dateFromFilter, dateToFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setAuthorFilter('');
    setDateFromFilter('');
    setDateToFilter('');
    setPosts([]);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ width: '100%', maxWidth: 800 }}>
      {/* Search Form */}
      <div style={{ 
        backgroundColor: 'white', 
        padding: 20, 
        borderRadius: 8, 
        border: '1px solid #e1e8ed',
        marginBottom: 20 
      }}>
        {/* Main Search */}
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder="🔍 Tìm kiếm nội dung bài viết..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              border: '1px solid #e1e8ed',
              borderRadius: 8,
              fontSize: 16,
              outline: 'none'
            }}
          />
        </div>

        {/* Advanced Filters Toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          style={{
            backgroundColor: 'transparent',
            border: '1px solid #1da1f2',
            color: '#1da1f2',
            padding: '6px 12px',
            borderRadius: 16,
            cursor: 'pointer',
            fontSize: 12,
            marginBottom: showAdvanced ? 16 : 0
          }}
        >
          {showAdvanced ? '▲ Ẩn bộ lọc' : '▼ Bộ lọc nâng cao'}
        </button>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div style={{ 
            backgroundColor: '#f7f9fa', 
            padding: 16, 
            borderRadius: 8,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12
          }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#657786', marginBottom: 4 }}>
                👤 Tác giả:
              </label>
              <input
                type="text"
                placeholder="Tên tác giả..."
                value={authorFilter}
                onChange={(e) => setAuthorFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e1e8ed',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#657786', marginBottom: 4 }}>
                📅 Từ ngày:
              </label>
              <input
                type="date"
                value={dateFromFilter}
                onChange={(e) => setDateFromFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e1e8ed',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 12, color: '#657786', marginBottom: 4 }}>
                📅 Đến ngày:
              </label>
              <input
                type="date"
                value={dateToFilter}
                onChange={(e) => setDateToFilter(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: '1px solid #e1e8ed',
                  borderRadius: 6,
                  fontSize: 14
                }}
              />
            </div>
          </div>
        )}

        {/* Search Actions */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginTop: showAdvanced ? 16 : 12 
        }}>
          <div style={{ fontSize: 12, color: '#657786' }}>
            {loading && '🔄 Đang tìm kiếm...'}
            {!loading && searchResults.length > 0 && `✅ Tìm thấy ${searchResults.length} bài viết`}
            {!loading && searchQuery.trim() && searchResults.length === 0 && '❌ Không tìm thấy bài viết nào'}
          </div>
          
          {(searchQuery || authorFilter || dateFromFilter || dateToFilter) && (
            <button
              onClick={clearFilters}
              style={{
                backgroundColor: '#e1e8ed',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 16,
                cursor: 'pointer',
                fontSize: 12
              }}
            >
              🗑️ Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Search Results */}
      <div>
        {searchResults.map((post) => (
          <div key={post.id} style={{
            backgroundColor: 'white',
            border: '1px solid #e1e8ed',
            borderRadius: 8,
            padding: 16,
            marginBottom: 16
          }}>
            {/* Post Header */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: 12 
            }}>
              <Link 
                to={`/profile/${post.user_id}`}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  textDecoration: 'none', 
                  color: 'inherit' 
                }}
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
                  {post.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{post.name}</div>
                  <div style={{ fontSize: 12, color: '#657786' }}>
                    {formatDate(post.created_at)}
                  </div>
                </div>
              </Link>
            </div>

            {/* Post Content */}
            <div style={{ marginBottom: 12 }}>
              <p style={{ 
                margin: 0, 
                lineHeight: 1.5,
                whiteSpace: 'pre-wrap' 
              }}>
                {post.content}
              </p>
              
              {post.image_url && (
                <img 
                  src={post.image_url} 
                  alt="Post" 
                  style={{ 
                    maxWidth: '100%', 
                    borderRadius: 8, 
                    marginTop: 12 
                  }} 
                />
              )}
            </div>

            {/* Post Actions */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 16,
              paddingTop: 12,
              borderTop: '1px solid #f7f9fa'
            }}>
              <LikeButton postId={post.id} initialLikes={post.likes_count} />
              
              <span style={{ fontSize: 14, color: '#657786' }}>
                💬 {post.comments_count || 0} comments
              </span>
              
              <Link 
                to={`/profile/${post.user_id}`}
                style={{ 
                  fontSize: 12, 
                  color: '#1da1f2', 
                  textDecoration: 'none',
                  marginLeft: 'auto'
                }}
              >
                👤 Xem profile
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* No Results */}
      {!loading && searchQuery.trim() && searchResults.length === 0 && (
        <div style={{
          textAlign: 'center',
          padding: 40,
          backgroundColor: 'white',
          borderRadius: 8,
          border: '1px solid #e1e8ed'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
          <h3 style={{ color: '#14171a', marginBottom: 8 }}>Không tìm thấy bài viết</h3>
          <p style={{ color: '#657786', margin: 0 }}>
            Thử tìm kiếm với từ khóa khác hoặc điều chỉnh bộ lọc
          </p>
        </div>
      )}

      {/* Search Tips */}
      {searchResults.length === 0 && !searchQuery.trim() && (
        <div style={{
          backgroundColor: '#f7f9fa',
          border: '1px solid #e1e8ed',
          borderRadius: 8,
          padding: 20,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h3>Tìm kiếm bài viết</h3>
          <div style={{ color: '#657786', fontSize: 14, lineHeight: 1.6 }}>
            <p><strong>💡 Mẹo tìm kiếm:</strong></p>
            <p>• Gõ từ khóa để tìm trong nội dung bài viết</p>
            <p>• Sử dụng bộ lọc nâng cao để tìm theo tác giả và thời gian</p>
            <p>• Kết quả được sắp xếp theo thời gian mới nhất</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPosts;
