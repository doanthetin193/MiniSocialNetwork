import React, { useState } from 'react';
import SearchUsers from '../components/SearchUsers';
import SearchPosts from '../components/SearchPosts';

const SearchPage = () => {
  const [searchMode, setSearchMode] = useState('users'); // users, posts

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20 }}>
      <h1 style={{ textAlign: 'center', marginBottom: 30 }}>🔍 Tìm kiếm</h1>
      
      {/* Search Mode Tabs */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        marginBottom: 30,
        borderBottom: '1px solid #e1e8ed'
      }}>
        <button
          onClick={() => setSearchMode('users')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: searchMode === 'users' ? '2px solid #1da1f2' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: searchMode === 'users' ? 'bold' : 'normal',
            fontSize: 16
          }}
        >
          👥 Người dùng
        </button>
        <button
          onClick={() => setSearchMode('posts')}
          style={{
            padding: '12px 24px',
            border: 'none',
            borderBottom: searchMode === 'posts' ? '2px solid #1da1f2' : '2px solid transparent',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            fontWeight: searchMode === 'posts' ? 'bold' : 'normal',
            fontSize: 16
          }}
        >
          📝 Bài viết
        </button>
      </div>

      {/* Search Content */}
      {searchMode === 'users' && (
        <div>
          <h3 style={{ marginBottom: 20 }}>Tìm kiếm người dùng</h3>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <SearchUsers />
          </div>
          <div style={{ 
            marginTop: 30, 
            padding: 20, 
            backgroundColor: '#f7f9fa', 
            borderRadius: 8,
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#657786', fontSize: 14 }}>
              💡 <strong>Mẹo:</strong> Gõ tên hoặc email để tìm kiếm người dùng. 
              Kết quả sẽ hiển thị ngay khi bạn gõ!
            </p>
          </div>
        </div>
      )}

      {searchMode === 'posts' && (
        <div>
          <h3 style={{ marginBottom: 20 }}>Tìm kiếm bài viết</h3>
          <SearchPosts />
        </div>
      )}
    </div>
  );
};

export default SearchPage;
