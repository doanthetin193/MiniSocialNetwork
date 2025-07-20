import React, { useState, useEffect, useRef, useCallback } from 'react';
import socket from '../socket';
import axios from 'axios';
import { Link } from 'react-router-dom';

const ChatPage = () => {
  const currentUser = JSON.parse(localStorage.getItem('user'));
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [users, setUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState({});
  const [typing, setTyping] = useState({});
  const [showUsersList, setShowUsersList] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null); // userId to delete
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const hasRegistered = useRef(false); // Prevent multiple registrations

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch conversations
        const conversationsRes = await axios.get('http://localhost:5000/api/chat/conversations', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setConversations(conversationsRes.data);
        
        // Fetch all users
        const usersRes = await axios.get('http://localhost:5000/api/users', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const otherUsers = usersRes.data.filter(user => user.id !== currentUser?.id);
        setUsers(otherUsers);
        
      } catch (err) {
        console.error('Error fetching initial data:', err);
      }
    };

    if (currentUser) {
      fetchInitialData();
    }
  }, [currentUser]);

  // Fetch conversations with useCallback
  const fetchConversations = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/chat/conversations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConversations(res.data);
    } catch (err) {
      console.error('Error fetching conversations:', err);
    }
  }, []);

  // Socket setup
  useEffect(() => {
    if (!currentUser) return;

    // Connect socket only once
    if (!socket.connected) {
      socket.connect();
    }

    // Register user only once
    const handleConnect = () => {
      if (!hasRegistered.current && currentUser?.id) {
        console.log('Socket connected, registering user:', currentUser.id);
        socket.emit('register', currentUser.id);
        hasRegistered.current = true;
      }
    };

    if (socket.connected) {
      handleConnect();
    } else {
      socket.on('connect', handleConnect);
    }
    
    // Check online status of all users
    const allUserIds = users.map(u => u.id);
    if (allUserIds.length > 0) {
      socket.emit('check_online', allUserIds);
    }

    // Socket listeners
    const handleReceiveMessage = (msg) => {
      console.log('Received message:', msg, 'Current chat with:', selectedUserId);
      
      // Tạo message object đúng format
      const newMessage = {
        id: msg.id || Date.now(),
        sender_id: msg.senderId,
        receiver_id: msg.receiverId, 
        content: msg.content,
        created_at: msg.createdAt,
        sender_name: msg.sender_name,
        receiver_name: msg.receiver_name
      };
      
      // Nếu đang chat với user gửi tin nhắn này, hiển thị ngay
      if (selectedUserId && 
          (msg.senderId === parseInt(selectedUserId) || msg.receiverId === parseInt(selectedUserId))) {
        console.log('Adding message to current chat');
        setMessages(prev => [...prev, newMessage]);
      }
      
      // Luôn update conversations list
      fetchConversations();
    };

    const handleMessageSent = (msg) => {
      console.log('Message sent successfully');
    };

    const handleUserOnline = ({ userId, online }) => {
      setOnlineUsers(prev => ({
        ...prev,
        [userId]: online
      }));
    };

    const handleOnlineStatus = (status) => {
      setOnlineUsers(status);
    };

    const handleUserTyping = ({ senderId }) => {
      setTyping(prev => ({
        ...prev,
        [senderId]: true
      }));
      
      setTimeout(() => {
        setTyping(prev => ({
          ...prev,
          [senderId]: false
        }));
      }, 3000);
    };

    const handleUserStopTyping = ({ senderId }) => {
      setTyping(prev => ({
        ...prev,
        [senderId]: false
      }));
    };

    socket.on('receive_message', handleReceiveMessage);
    socket.on('message_sent', handleMessageSent);
    socket.on('user_online', handleUserOnline);
    socket.on('online_status', handleOnlineStatus);
    socket.on('user_typing', handleUserTyping);
    socket.on('user_stop_typing', handleUserStopTyping);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('receive_message', handleReceiveMessage);
      socket.off('message_sent', handleMessageSent);
      socket.off('user_online', handleUserOnline);
      socket.off('online_status', handleOnlineStatus);
      socket.off('user_typing', handleUserTyping);
      socket.off('user_stop_typing', handleUserStopTyping);
    };
  }, [currentUser, users, selectedUserId, fetchConversations]);

  const fetchChat = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/chat/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessages(res.data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  };

  const selectUser = (user) => {
    setSelectedUserId(user.id);
    setSelectedUser(user);
    setShowUsersList(false);
    setShowDeleteConfirm(null); // Close any delete confirm
    fetchChat(user.id);
  };

  const deleteConversation = async (otherUserId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/chat/conversation/${otherUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Refresh conversations list
      fetchConversations();
      
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
    
    socket.emit('private_message', {
      senderId: currentUser.id,
      receiverId: selectedUserId,
      content: content.trim(),
    });
    
    // Add to local messages immediately
    const newMessage = {
      id: Date.now(),
      sender_id: currentUser.id,
      receiver_id: selectedUserId,
      content: content.trim(),
      created_at: new Date(),
      sender_name: currentUser.name,
      receiver_name: selectedUser.name
    };
    
    setMessages(prev => [...prev, newMessage]);
    setContent('');
    
    // Stop typing indicator
    socket.emit('stop_typing', {
      senderId: currentUser.id,
      receiverId: selectedUserId
    });
  };

  const handleTyping = (e) => {
    setContent(e.target.value);
    
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
    messages.forEach(msg => {
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
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      hasRegistered.current = false;
    };
  }, []);

  return (
    <div style={{ 
      display: 'flex', 
      height: 'calc(100vh - 60px)', 
      backgroundColor: '#f0f2f5' 
    }}>
      {/* Sidebar - Conversations */}
      <div style={{
        width: 320,
        backgroundColor: 'white',
        borderRight: '1px solid #e1e8ed',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid #e1e8ed',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>💬 Chat</h3>
          <button
            onClick={() => setShowUsersList(!showUsersList)}
            style={{
              backgroundColor: '#1da1f2',
              color: 'white',
              border: 'none',
              borderRadius: 20,
              padding: '6px 12px',
              cursor: 'pointer',
              fontSize: 12
            }}
          >
            ➕ Chat mới
          </button>
        </div>

        {/* Users List (when creating new chat) */}
        {showUsersList && (
          <div style={{
            maxHeight: 200,
            overflowY: 'auto',
            borderBottom: '1px solid #e1e8ed'
          }}>
            <div style={{ padding: '8px 16px', fontSize: 12, color: '#657786', fontWeight: 'bold' }}>
              CHỌN NGƯỜI ĐỂ CHAT
            </div>
            {users.map(user => (
              <div
                key={user.id}
                onClick={() => selectUser(user)}
                style={{
                  padding: '8px 16px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f7f9fa'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  backgroundColor: '#1da1f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 'bold',
                  position: 'relative'
                }}>
                  {user.name.charAt(0).toUpperCase()}
                  {onlineUsers[user.id] && (
                    <div style={{
                      position: 'absolute',
                      bottom: -2,
                      right: -2,
                      width: 12,
                      height: 12,
                      borderRadius: '50%',
                      backgroundColor: '#4ade80',
                      border: '2px solid white'
                    }} />
                  )}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 'bold' }}>{user.name}</div>
                  <div style={{ fontSize: 11, color: onlineUsers[user.id] ? '#4ade80' : '#657786' }}>
                    {onlineUsers[user.id] ? '🟢 Online' : '⚫ Offline'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Conversations List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {conversations.length === 0 ? (
            <div style={{ padding: 20, textAlign: 'center', color: '#657786' }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>💬</div>
              <p>Chưa có cuộc trò chuyện nào</p>
              <p style={{ fontSize: 12 }}>Nhấn "Chat mới" để bắt đầu</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div
                key={conv.other_user_id}
                style={{
                  position: 'relative',
                  borderBottom: '1px solid #f7f9fa',
                  backgroundColor: selectedUserId === conv.other_user_id ? '#e3f2fd' : 'white',
                  transition: 'background-color 0.2s'
                }}
              >
                {/* Main conversation item */}
                <div
                  onClick={() => selectUser({ id: conv.other_user_id, name: conv.name, email: conv.email })}
                  style={{
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  onMouseEnter={(e) => {
                    if (selectedUserId !== conv.other_user_id) {
                      e.currentTarget.parentElement.style.backgroundColor = '#f7f9fa';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (selectedUserId !== conv.other_user_id) {
                      e.currentTarget.parentElement.style.backgroundColor = 'white';
                    }
                  }}
                >
                  <div style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: '#1da1f2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    color: 'white',
                    fontSize: 16,
                    fontWeight: 'bold',
                    position: 'relative'
                  }}>
                    {conv.name.charAt(0).toUpperCase()}
                    {onlineUsers[conv.other_user_id] && (
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        right: 0,
                        width: 14,
                        height: 14,
                        borderRadius: '50%',
                        backgroundColor: '#4ade80',
                        border: '2px solid white'
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ 
                      fontSize: 14, 
                      fontWeight: 'bold',
                      marginBottom: 2
                    }}>
                      {conv.name}
                    </div>
                    <div style={{ 
                      fontSize: 12, 
                      color: '#657786',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {conv.last_sender_id === currentUser.id ? 'Bạn: ' : ''}
                      {conv.last_message || 'Chưa có tin nhắn'}
                    </div>
                    <div style={{ fontSize: 10, color: '#8899a6', marginTop: 2 }}>
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
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    border: 'none',
                    backgroundColor: '#ff4757',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0.7,
                    transition: 'opacity 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.opacity = '1'}
                  onMouseLeave={(e) => e.target.style.opacity = '0.7'}
                  title="Xóa cuộc trò chuyện"
                >
                  ✕
                </button>

                {/* Delete Confirmation Modal */}
                {showDeleteConfirm === conv.other_user_id && (
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: 16,
                    zIndex: 10
                  }}>
                    <div style={{ textAlign: 'center', marginBottom: 16 }}>
                      <div style={{ fontSize: 24, marginBottom: 8 }}>🗑️</div>
                      <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 4 }}>
                        Xóa cuộc trò chuyện?
                      </div>
                      <div style={{ fontSize: 12, color: '#657786' }}>
                        Với {conv.name}
                      </div>
                    </div>
                    
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteConfirm(null);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 16,
                          border: '1px solid #e1e8ed',
                          backgroundColor: 'white',
                          cursor: 'pointer',
                          fontSize: 12
                        }}
                      >
                        Hủy
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.other_user_id);
                        }}
                        style={{
                          padding: '6px 12px',
                          borderRadius: 16,
                          border: 'none',
                          backgroundColor: '#ff4757',
                          color: 'white',
                          cursor: 'pointer',
                          fontSize: 12,
                          fontWeight: 'bold'
                        }}
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
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div style={{
              padding: 16,
              backgroundColor: 'white',
              borderBottom: '1px solid #e1e8ed',
              display: 'flex',
              alignItems: 'center'
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
                fontSize: 14,
                fontWeight: 'bold',
                position: 'relative'
              }}>
                {selectedUser.name.charAt(0).toUpperCase()}
                {onlineUsers[selectedUser.id] && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: '#4ade80',
                    border: '2px solid white'
                  }} />
                )}
              </div>
              <div>
                <Link 
                  to={`/profile/${selectedUser.id}`}
                  style={{ textDecoration: 'none', color: 'inherit' }}
                >
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{selectedUser.name}</div>
                </Link>
                <div style={{ fontSize: 12, color: onlineUsers[selectedUser.id] ? '#4ade80' : '#657786' }}>
                  {onlineUsers[selectedUser.id] ? '🟢 Đang hoạt động' : '⚫ Không hoạt động'}
                  {typing[selectedUser.id] && ' • đang nhập...'}
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: 16,
              backgroundColor: '#f0f2f5'
            }}>
              {Object.keys(messageGroups).map(dateKey => (
                <div key={dateKey}>
                  {/* Date Separator */}
                  <div style={{
                    textAlign: 'center',
                    margin: '16px 0',
                    position: 'relative'
                  }}>
                    <div style={{
                      display: 'inline-block',
                      backgroundColor: '#e1e8ed',
                      padding: '4px 12px',
                      borderRadius: 12,
                      fontSize: 12,
                      color: '#657786'
                    }}>
                      {formatDate(dateKey)}
                    </div>
                  </div>

                  {/* Messages for this date */}
                  {messageGroups[dateKey].map((msg) => {
                    const isMyMessage = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        style={{
                          display: 'flex',
                          justifyContent: isMyMessage ? 'flex-end' : 'flex-start',
                          marginBottom: 8
                        }}
                      >
                        <div style={{
                          maxWidth: '70%',
                          padding: '8px 12px',
                          borderRadius: 18,
                          backgroundColor: isMyMessage ? '#1da1f2' : 'white',
                          color: isMyMessage ? 'white' : '#14171a',
                          position: 'relative',
                          wordWrap: 'break-word'
                        }}>
                          <div style={{ fontSize: 14, lineHeight: 1.4 }}>
                            {msg.content}
                          </div>
                          <div style={{
                            fontSize: 10,
                            opacity: 0.7,
                            marginTop: 4,
                            textAlign: 'right'
                          }}>
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
                <div style={{
                  display: 'flex',
                  justifyContent: 'flex-start',
                  marginBottom: 8
                }}>
                  <div style={{
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    borderRadius: 18,
                    color: '#657786',
                    fontSize: 12,
                    fontStyle: 'italic'
                  }}>
                    {selectedUser.name} đang nhập...
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div style={{
              padding: 16,
              backgroundColor: 'white',
              borderTop: '1px solid #e1e8ed'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: 8,
                backgroundColor: '#f7f9fa',
                borderRadius: 20,
                padding: 8
              }}>
                <textarea
                  placeholder={`Nhắn tin cho ${selectedUser.name}...`}
                  value={content}
                  onChange={handleTyping}
                  onKeyPress={handleKeyPress}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    backgroundColor: 'transparent',
                    padding: '8px 12px',
                    fontSize: 14,
                    lineHeight: 1.4,
                    maxHeight: 100,
                    minHeight: 20
                  }}
                  rows={1}
                />
                <button
                  onClick={sendMessage}
                  disabled={!content.trim()}
                  style={{
                    backgroundColor: content.trim() ? '#1da1f2' : '#e1e8ed',
                    color: content.trim() ? 'white' : '#657786',
                    border: 'none',
                    borderRadius: '50%',
                    width: 36,
                    height: 36,
                    cursor: content.trim() ? 'pointer' : 'not-allowed',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 16
                  }}
                >
                  ➤
                </button>
              </div>
            </div>
          </>
        ) : (
          /* No chat selected */
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'white'
          }}>
            <div style={{ textAlign: 'center', color: '#657786' }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>💬</div>
              <h3>Chọn một cuộc trò chuyện</h3>
              <p>Chọn từ danh sách bên trái hoặc tạo chat mới</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;
