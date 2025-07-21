import React, { useState, useEffect, useRef } from 'react';
import socket from '../socket'; // ENABLED FOR REAL-TIME CHAT
import axios from 'axios';
import { Link } from 'react-router-dom';
import styles from './ChatPage.module.css';

const ChatPage = () => {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [selectedUserId, _setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({}); // Real-time online status
  const [typing, setTyping] = useState({}); // Real-time typing indicators
  const [showUsersList, setShowUsersList] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // userId to delete
  const [isRefreshing, setIsRefreshing] = useState(false); // Hiển thị trạng thái refresh
  const [onlineStatusVersion, setOnlineStatusVersion] = useState(0); // Force re-render on online status change
  // ...existing code...
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null); // ENABLED FOR REAL-TIME
  const hasRegistered = useRef(false); // Prevent multiple registrations
  const isInitialized = useRef(false); // Prevent multiple socket setups

  // REF FOR LATEST SELECTED USER ID
  const selectedUserIdRef = useRef(selectedUserId);
  // Always sync ref with state
  const setSelectedUserId = (id) => {
    _setSelectedUserId(id);
    selectedUserIdRef.current = id;
  } 


  // Auto scroll to bottom (robust)
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      try {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
      } catch (e) {
        messagesEndRef.current.scrollIntoView();
      }
    }
  } 


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial data - with proper initialization guard
  const [hasInitialized, setHasInitialized] = useState(false);
  
  useEffect(() => {
    // Early return if already initialized or no user/token
    if (hasInitialized || !currentUser || !localStorage.getItem('token')) {
      return;
    }
    
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          console.warn('No token found - user may need to login');
          return;
        }
        
        // Set initialized flag early to prevent duplicate calls
        setHasInitialized(true);
        
        // Fetch conversations
        const conversationsRes = await axios.get('http://localhost:5000/api/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const validConversations = (conversationsRes.data || []).filter(conv => 
          conv && conv.other_user_id && conv.name
        );
        setConversations(validConversations);
        
        // Fetch all users
        const usersRes = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const validUsers = (usersRes.data || []).filter(user => 
          user && user.id && user.name && user.id !== currentUser?.id
        );
        setUsers(validUsers);
        
      } catch (err) {
        console.error('Error fetching initial data:', err);
        // Reset initialization flag on error to allow retry
        setHasInitialized(false);
        if (err.response?.status === 401) {
          console.error('Unauthorized - token may be expired');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      }
    };

    fetchInitialData();
  }, [currentUser, hasInitialized]);

  // Cập nhật conversations khi có tin nhắn mới với debounce
  const updateConversationsRef = useRef(null);
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      // Chỉ cập nhật conversations nếu tin nhắn cuối là mới (trong vòng 5 giây)
      const messageTime = new Date(lastMessage.created_at);
      const now = new Date();
      if (now - messageTime < 5000) {
        // Debounce để tránh gọi quá nhiều lần
        if (updateConversationsRef.current) {
          clearTimeout(updateConversationsRef.current);
        }
        updateConversationsRef.current = setTimeout(async () => {
          try {
            const token = localStorage.getItem('token');
            const res = await axios.get('http://localhost:5000/api/chat/conversations', {
              headers: { Authorization: `Bearer ${token}` }
            });
            setConversations(res.data);
          } catch (err) {
            console.error('Error fetching conversations:', err);
          }
        }, 500);
      }
    }
    
    return () => {
      if (updateConversationsRef.current) {
        clearTimeout(updateConversationsRef.current);
      }
    };
  }, [messages]); // Depend vào messages nhưng không gọi fetchConversations trực tiếp

  // Auto-refresh disabled - using real-time Socket.IO instead


  // Hàm fetchConversations để cập nhật sidebar real-time
  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error('Error updating conversations:', err);
    }
  };

  // Socket setup - SINGLE CONNECTION FOR ENTIRE APP LIFECYCLE
  useEffect(() => {
    if (!currentUser?.id || !localStorage.getItem('token')) return;
    if (isInitialized.current) return; // Already initialized

    // ...existing code...
    isInitialized.current = true;

    // Only connect once globally
    if (!socket.connected && !socket.connecting) {
      // ...existing code...
      socket.connect();
    }

    // Register user only once
    const registerUser = () => {
      if (!hasRegistered.current && socket.connected) {
        socket.emit('register', currentUser.id);
        hasRegistered.current = true;
        // Gửi check_online ngay sau khi register
        const allUserIds = users.map(u => u.id);
        if (selectedUserId && !allUserIds.includes(selectedUserId)) {
          allUserIds.push(selectedUserId);
        }
        if (allUserIds.length > 0) {
          socket.emit('check_online', allUserIds);
        }
      }
    };

    // Event handlers
    const handleConnect = () => {
      // ...existing code...
      registerUser();
    };

    const handleDisconnect = () => {
      // ...existing code...
      hasRegistered.current = false;
    };

    // Khi nhận tin nhắn mới qua socket
    const handleReceiveMessage = (msg) => {
      // Cập nhật lại trạng thái online
      socket.emit('check_online', [msg.senderId, msg.receiverId]);
      // Nếu đang xem đúng cuộc trò chuyện thì cập nhật khung chat
      const currentSelectedUserId = selectedUserIdRef.current ? Number(selectedUserIdRef.current) : null;
      const isRelated = currentSelectedUserId && (
        (Number(msg.senderId) === currentSelectedUserId && Number(msg.receiverId) === Number(currentUser?.id)) ||
        (Number(msg.receiverId) === currentSelectedUserId && Number(msg.senderId) === Number(currentUser?.id))
      );
      if (isRelated) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === msg.id);
          if (!exists) {
            return [...prev, {
              id: msg.id,
              sender_id: msg.senderId,
              receiver_id: msg.receiverId,
              content: msg.content,
              created_at: msg.createdAt || new Date(),
              sender_name: msg.sender_name,
              receiver_name: msg.receiver_name
            }];
          }
          return prev;
        });
      }
      // Cập nhật conversations local nếu có thể
      setConversations(prev => {
        let updated = [...prev];
        const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
        const idx = updated.findIndex(c => c.other_user_id === otherId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            last_message: msg.content,
            last_message_time: msg.createdAt || new Date(),
            last_sender_id: msg.senderId
          };
          // Đưa cuộc trò chuyện lên đầu
          const [conv] = updated.splice(idx, 1);
          updated.unshift(conv);
        } else {
          // Nếu chưa có, thêm mới
          updated.unshift({
            other_user_id: otherId,
            name: msg.senderId === currentUser.id ? msg.receiver_name : msg.sender_name,
            email: '', // Nếu có thể lấy email thì thêm vào
            last_message: msg.content,
            last_message_time: msg.createdAt || new Date(),
            last_sender_id: msg.senderId
          });
        }
        return updated;
      });
    };

    // Khi gửi tin nhắn thành công (server xác nhận), cập nhật ngay khung chat và sidebar
    const handleMessageSent = (msg) => {
      // Nếu đang xem đúng cuộc trò chuyện thì cập nhật khung chat
      const currentSelectedUserId = selectedUserIdRef.current ? Number(selectedUserIdRef.current) : null;
      const isRelated = currentSelectedUserId && (
        (Number(msg.senderId) === currentSelectedUserId && Number(msg.receiverId) === Number(currentUser?.id)) ||
        (Number(msg.receiverId) === currentSelectedUserId && Number(msg.senderId) === Number(currentUser?.id))
      );
      if (isRelated) {
        setMessages(prev => {
          const exists = prev.some(m => m.id === msg.id);
          if (!exists) {
            return [...prev, {
              id: msg.id,
              sender_id: msg.senderId,
              receiver_id: msg.receiverId,
              content: msg.content,
              created_at: msg.createdAt || new Date(),
              sender_name: msg.sender_name,
              receiver_name: msg.receiver_name
            }];
          }
          return prev;
        });
      }
      // Cập nhật conversations local nếu có thể
      setConversations(prev => {
        let updated = [...prev];
        const otherId = msg.senderId === currentUser.id ? msg.receiverId : msg.senderId;
        const idx = updated.findIndex(c => c.other_user_id === otherId);
        if (idx !== -1) {
          updated[idx] = {
            ...updated[idx],
            last_message: msg.content,
            last_message_time: msg.createdAt || new Date(),
            last_sender_id: msg.senderId
          };
          // Đưa cuộc trò chuyện lên đầu
          const [conv] = updated.splice(idx, 1);
          updated.unshift(conv);
        } else {
          // Nếu chưa có, thêm mới
          updated.unshift({
            other_user_id: otherId,
            name: msg.senderId === currentUser.id ? msg.receiver_name : msg.sender_name,
            email: '',
            last_message: msg.content,
            last_message_time: msg.createdAt || new Date(),
            last_sender_id: msg.senderId
          });
        }
        return updated;
      });
    };

    const handleUserOnline = ({ userId, online }) => {
      setOnlineUsers(prev => ({ ...prev, [userId]: online }));
      setOnlineStatusVersion(v => v + 1); // Force re-render
      fetchConversations();
      // Nếu đang xem đúng user thì force re-render selectedUser
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(user => ({ ...user }));
      }
    };

    const handleOnlineStatus = (status) => {
      setOnlineUsers(status);
      setOnlineStatusVersion(v => v + 1);
      fetchConversations();
      // Nếu đang xem đúng user thì force re-render selectedUser
      if (selectedUser && status[selectedUser.id]) {
        setSelectedUser(user => ({ ...user }));
      }
    };

    const handleUserTyping = ({ senderId }) => {
      setTyping(prev => ({ ...prev, [senderId]: true }));
      setTimeout(() => setTyping(prev => ({ ...prev, [senderId]: false })), 3000);
    };

    const handleUserStopTyping = ({ senderId }) => {
      setTyping(prev => ({ ...prev, [senderId]: false }));
    };

    // If already connected, register immediately
    if (socket.connected) {
      registerUser();
    }

    // Register all event listeners
    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);
    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_online', handleUserOnline);
    socket.on('online_status', handleOnlineStatus);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    // Cleanup function
    return () => {
      // ...existing code...
      socket.off('message_sent', handleMessageSent);
    };
  }, [currentUser?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Check online status when users list changes or selected user changes
  const checkOnlineTimeoutRef = useRef(null);
  
  useEffect(() => {
    // Clear previous timeout
    if (checkOnlineTimeoutRef.current) {
      clearTimeout(checkOnlineTimeoutRef.current);
    }
    
    // Debounce the online check to prevent loops
    checkOnlineTimeoutRef.current = setTimeout(() => {
      if (socket.connected && users.length > 0) {
        const allUserIds = users.filter(u => u && u.id).map(u => u.id);
        socket.emit('check_online', allUserIds);
      }
    }, 100);
    
    return () => {
      if (checkOnlineTimeoutRef.current) {
        clearTimeout(checkOnlineTimeoutRef.current);
      }
    };
  }, [users]); // Only depend on users, not onlineUsers

  // Check online status for selected user specifically
  useEffect(() => {
    if (socket.connected && selectedUserId) {
      // Delay to avoid rapid fire requests
      setTimeout(() => {
        socket.emit('check_online', [selectedUserId]);
      }, 100);
    }
  }, [selectedUserId]);

  // ...existing code...

  // Periodic online status check - but only if not already checking frequently
  useEffect(() => {
    const interval = setInterval(() => {
      if (socket.connected && (users.length > 0 || selectedUserId)) {
        const allUserIds = users.filter(u => u && u.id).map(u => u.id);
        if (selectedUserId && !allUserIds.includes(selectedUserId)) {
          allUserIds.push(selectedUserId);
        }
        if (allUserIds.length > 0) {
          socket.emit('check_online', allUserIds);
        }
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [users, selectedUserId]);


  const fetchChat = async (userId) => {
    try {
      setIsRefreshing(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for fetchChat');
        return;
      }
      const res = await axios.get(`http://localhost:5000/api/chat/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const validMessages = (res.data || []).filter(msg => msg && msg.id);
      setMessages(validMessages);
      scrollToBottom();
    } catch (err) {
      console.error('Error fetching messages:', err);
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } finally {
      setIsRefreshing(false);
    }
  };


  const selectUser = (user) => {
    setSelectedUserId(Number(user.id)); // Đảm bảo kiểu số
    setSelectedUser(user);
    setShowUsersList(false);
    setShowDeleteConfirm(null); // Close any delete confirm
    fetchChat(Number(user.id)); // Đảm bảo kiểu số
    // Yêu cầu cập nhật trạng thái online ngay khi chọn user
    socket.emit('check_online', [user.id]);
  };

  const deleteConversation = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/chat/conversation/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh conversations list
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversations(res.data);
      } catch (err) {
        console.error('Error refreshing conversations:', err);
      }
      
      // If deleting current conversation, clear chat
      if (selectedUserId === otherUserId) {
        setSelectedUserId(null);
        setSelectedUser(null);
        setMessages([]);
      }
      
      setShowDeleteConfirm(null);
      
    } catch (err) {
      console.error('Error deleting conversation:', err);
      alert('Lỗi khi xóa cuộc trò chuyện');
    }
  };

  const sendMessage = () => {
    if (!content.trim() || !selectedUserId) return;
    const messageContent = content.trim();
    setContent('');
    const tempId = `local_${Date.now()}_${Math.random()}`;
    const tempMessage = {
      id: tempId,
      sender_id: currentUser.id,
      receiver_id: parseInt(selectedUserId),
      content: messageContent,
      created_at: new Date(),
      sender_name: currentUser.name,
      receiver_name: selectedUser.name
    };
    setMessages(prev => {
      const exists = prev.some(msg => msg.id === tempId);
      if (exists) return prev;
      return [...prev, tempMessage];
    });
    // Gửi tin nhắn qua Socket.IO
    socket.emit('private_message', {
      senderId: currentUser.id,
      receiverId: parseInt(selectedUserId),
      content: messageContent,
    });
    socket.emit('stop_typing', {
      senderId: currentUser.id,
      receiverId: selectedUserId
    });
    // Cập nhật lại conversations ngay
    setTimeout(fetchConversations, 100);
  };

  const handleTyping = (e) => {
    setContent(e.target.value);
    
    // Real-time typing indicators via Socket.IO
    if (selectedUserId && e.target.value.trim()) {
      socket.emit('typing', {
        senderId: currentUser.id,
        receiverId: selectedUserId
      });
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('stop_typing', {
          senderId: currentUser.id,
          receiverId: selectedUserId
        });
      }, 1000);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (date) => {
    const today = new Date();
    const messageDate = new Date(date);
    
    if (messageDate.toDateString() === today.toDateString()) {
      return 'Hôm nay';
    }
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (messageDate.toDateString() === yesterday.toDateString()) {
      return 'Hôm qua';
    }
    
    return messageDate.toLocaleDateString('vi-VN');
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = {};
    (messages || []).filter(msg => msg && msg.created_at).forEach(msg => {
      const date = new Date(msg.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(msg);
    });
    return groups;
  };

  const messageGroups = groupMessagesByDate(messages);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Reset registration flag when component unmounts
      hasRegistered.current = false;
    // ...existing code...
    };
  }, []);

  // Khi onlineStatusVersion thay đổi, force re-render users/conversations
  useEffect(() => {
    setUsers(users => [...users]);
    setConversations(convs => [...convs]);
  }, [onlineStatusVersion]);

  // Early return if no user logged in
  if (!currentUser) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.emptyChat}>
          <div className={styles.emptyChatIcon}>🔐</div>
          <div className={styles.emptyChatTitle}>Vui lòng đăng nhập</div>
          <div className={styles.emptyChatSubtitle}>Bạn cần đăng nhập để sử dụng chat</div>
        </div>
      </div>
    );
  }

  // Check token
  const token = localStorage.getItem('token');
  if (!token) {
    return (
      <div className={styles.chatContainer}>
        <div className={styles.emptyChat}>
          <div className={styles.emptyChatIcon}>🔑</div>
          <div className={styles.emptyChatTitle}>Token không hợp lệ</div>
          <div className={styles.emptyChatSubtitle}>Vui lòng đăng nhập lại</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.chatContainer}>
      {/* Sidebar - Conversations */}
      <div className={styles.sidebar}>
        {/* Header */}
        <div className={styles.sidebarHeader}>
          <h3 className={styles.sidebarTitle}>💬 Chat</h3>
          <button
            onClick={() => setShowUsersList(!showUsersList)}
            className={styles.newChatButton}
          >
            ➕ Chat mới
          </button>
        </div>

        {/* Users List (when creating new chat) */}
        {showUsersList && (
          <div className={styles.usersList}>
            <div className={styles.usersListHeader}>
              CHỌN NGƯỜI ĐỂ CHAT
            </div>
            {users
              .filter(user => user && user.id && user.name) // Filter out null/invalid users
              .map(user => (
              <div
                key={user.id}
                onClick={() => selectUser(user)}
                className={styles.userItem}
              >
                <div className={styles.userAvatar}>
                  {user.name.charAt(0).toUpperCase()}
                  {onlineUsers[user.id] && (
                    <div className={styles.onlineIndicator} />
                  )}
                </div>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>{user.name}</div>
                  <div className={`${styles.userStatus} ${onlineUsers[user.id] ? styles.online : styles.offline}`}>
                    {onlineUsers[user.id] ? '🟢 Online' : '⚫ Offline'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conversations List */}
        <div className={styles.conversationsList}>
          {conversations.length === 0 ? (
            <div className={styles.emptyConversations}>
              <div className={styles.emptyIcon}>💬</div>
              <div className={styles.emptyTitle}>Chưa có cuộc trò chuyện nào</div>
              <div className={styles.emptySubtitle}>Nhấn "Chat mới" để bắt đầu</div>
            </div>
          ) : (
            conversations
              .filter(conv => conv && conv.other_user_id && conv.name) // Filter out null/invalid conversations
              .map(conv => (
              <div
                key={conv.other_user_id}
                className={`${styles.conversationItem} ${selectedUserId === conv.other_user_id ? styles.selected : ''}`}
              >
                {/* Main conversation item */}
                <div
                  onClick={() => selectUser({ id: conv.other_user_id, name: conv.name, email: conv.email })}
                  className={styles.conversationContent}
                >
                  <div className={styles.conversationAvatar}>
                    {conv.name.charAt(0).toUpperCase()}
                    {onlineUsers[conv.other_user_id] && (
                      <div className={styles.onlineIndicator} />
                    )}
                  </div>
                  <div className={styles.conversationInfo}>
                    <div className={styles.conversationName}>
                      {conv.name}
                    </div>
                    <div className={styles.lastMessage}>
                      {currentUser && conv.last_sender_id === currentUser.id ? 'Bạn: ' : ''}
                      {conv.last_message || 'Chưa có tin nhắn'}
                    </div>
                    <div className={styles.messageTime}>
                      {conv.last_message_time && formatTime(conv.last_message_time)}
                    </div>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(conv.other_user_id);
                  }}
                  className={styles.deleteButton}
                  title="Xóa cuộc trò chuyện"
                >
                  ✕
                </button>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm === conv.other_user_id && (
                  <div className={styles.deleteConfirmation}>
                    <div className={styles.deleteContent}>
                      <div className={styles.deleteIcon}>🗑️</div>
                      <div className={styles.deleteTitle}>
                        Xóa cuộc trò chuyện?
                      </div>
                      <div className={styles.deleteSubtitle}>
                        Với {conv.name}
                      </div>
                    </div>
                    
                    <div className={styles.deleteActions}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(null);
                        }}
                        className={styles.deleteCancel}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.other_user_id);
                        }}
                        className={styles.deleteConfirm}
                      >
                        Xóa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={styles.chatArea}>
        {/* Real-time Mode Notice */}
        <div style={{
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          color: 'white',
          padding: '8px 16px',
          textAlign: 'center',
          fontSize: '14px',
          fontWeight: '500',
          borderRadius: '0 0 8px 8px',
          marginBottom: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          🚀 Chat Real-time - Tin nhắn được gửi ngay lập tức qua Socket.IO
        </div>
        
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className={styles.chatHeader}>
              <div className={styles.chatHeaderUser}>
                <div className={styles.chatHeaderAvatar}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                  {onlineUsers[selectedUser.id] && (
                    <div className={styles.onlineIndicator} />
                  )}
                </div>
                <div className={styles.chatHeaderInfo}>
                  <Link 
                    to={`/profile/${selectedUser.id}`}
                    style={{ textDecoration: 'none', color: 'inherit' }}
                  >
                    <div className={styles.chatHeaderName}>{selectedUser.name}</div>
                  </Link>
                  <div className={`${styles.chatHeaderStatus} ${onlineUsers[selectedUser.id] ? styles.online : styles.offline}`}>
                    {onlineUsers[selectedUser.id] ? '🟢 Đang hoạt động' : '⚫ Không hoạt động'}
                    {typing[selectedUser.id] && ' • đang nhập...'}
                    {isRefreshing && ' • 🔄 đang làm mới...'}
                  </div>
                </div>
              </div>
              <Link 
                to={`/profile/${selectedUser.id}`}
                className={styles.profileButton}
              >
                👤 Xem profile
              </Link>
            </div>

            {/* Messages Area */}
            <div className={styles.messagesContainer}>
              {Object.keys(messageGroups).map(dateKey => (
                <div key={dateKey} className={styles.dateGroup}>
                  {/* Date Separator */}
                  <div className={styles.dateHeader}>
                    <div className={styles.dateLabel}>
                      {formatDate(dateKey)}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {messageGroups[dateKey].map((msg) => {
                    const isMyMessage = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`${styles.message} ${isMyMessage ? styles.own : ''}`}
                      >
                        <div className={styles.messageAvatar}>
                          {isMyMessage ? 
                            currentUser.name.charAt(0).toUpperCase() : 
                            selectedUser.name.charAt(0).toUpperCase()
                          }
                        </div>
                        <div className={styles.messageContent}>
                          <div className={`${styles.messageBubble} ${isMyMessage ? styles.own : styles.other}`}>
                            {msg.content}
                          </div>
                          <div className={`${styles.messageTime} ${isMyMessage ? styles.own : styles.other}`}>
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              
              {/* Typing Indicator */}
              {typing[selectedUser.id] && (
                <div className={styles.typingIndicator}>
                  <div className={styles.typingDots}>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                    <div className={styles.typingDot}></div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className={styles.inputContainer}>
              <div className={styles.inputWrapper}>
                <textarea
                  placeholder={`Nhắn tin cho ${selectedUser.name}...`}
                  value={content}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  className={styles.messageInput}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!content.trim()}
                  className={styles.sendButton}
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No chat selected */
          <div className={styles.emptyChat}>
            <div className={styles.emptyChatIcon}>💬</div>
            <div className={styles.emptyChatTitle}>Chọn một cuộc trò chuyện</div>
            <div className={styles.emptyChatSubtitle}>Chọn từ danh sách bên trái hoặc tạo chat mới</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
