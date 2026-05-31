import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Icon } from '@iconify/react';
import sendIcon from '@iconify/icons-mdi/send';
import accountGroupIcon from '@iconify/icons-mdi/account-group';
import circleIcon from '@iconify/icons-mdi/circle';
import accountIcon from '@iconify/icons-mdi/account';
import messageTextIcon from '@iconify/icons-mdi/message-text';
import arrowLeftIcon from '@iconify/icons-mdi/arrow-left';
import menuIcon from '@iconify/icons-mdi/menu';
import searchIcon from '@iconify/icons-mdi/magnify';
import { SOCKET_URL } from '../config';
import { API_URL } from '../config';
import './ChatPage.css';


const ChatPage = ({ isDarkTheme, currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateChats, setPrivateChats] = useState({});
  const [unreadPrivate, setUnreadPrivate] = useState({});
  const [pendingMessages, setPendingMessages] = useState(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false); // Mobile sidebar toggle
  
  // NEW: Search functionality
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Connect to socket
  useEffect(() => {
    if (!currentUser) return;

    console.log('🔌 Connecting as:', currentUser.fullName, '(ID:', currentUser.id, ')');

    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    newSocket.emit('user_join', {
      id: currentUser.id,
      name: currentUser.fullName || currentUser.username
    });

    newSocket.on('message_history', (history) => {
      setGroupMessages(history || []);
    });

    newSocket.on('new_message', (msg) => {
      if (msg.confirmed) {
        setPendingMessages(prev => {
          const updated = new Set(prev);
          updated.delete(msg.id);
          return updated;
        });
        return;
      }
      setGroupMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    newSocket.on('private_message_history', (history) => {
      const chats = {};
      history.forEach(msg => {
        const otherId = msg.sender_id === currentUser.id ? msg.receiver_id : msg.sender_id;
        if (!chats[otherId]) {
          chats[otherId] = { user: null, messages: [] };
        }
        chats[otherId].messages.push(msg);
      });
      setPrivateChats(prev => ({ ...prev, ...chats }));
    });

    newSocket.on('private_message', (msg) => {
      const otherUserId = msg.sender_id;
      setPrivateChats(prev => {
        const existing = prev[otherUserId] || { user: null, messages: [] };
        if (existing.messages.some(m => m.id === msg.id)) return prev;
        return {
          ...prev,
          [otherUserId]: {
            ...existing,
            messages: [...existing.messages, msg]
          }
        };
      });
      if (!selectedUser || selectedUser.id !== otherUserId) {
        setUnreadPrivate(prev => ({ ...prev, [otherUserId]: true }));
      }
    });

    newSocket.on('private_message_sent', (data) => {
      console.log('✅ Message sent:', data.id, 'Delivered:', data.delivered);
    });

    newSocket.on('students_updated', (students) => {
      setAllStudents(students || []);
      setOnlineUsers((students || []).filter(s => s.status === 'online'));
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser]);

  // Fetch initial data
  useEffect(() => {
    if (!currentUser) return;
    fetch(`${API_URL}/api/students`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAllStudents(data.students);
          setOnlineUsers(data.students.filter(s => s.status === 'online'));
        }
      })
      .catch(err => console.error('Error:', err));
  }, [currentUser]);

  // NEW: Handle search functionality
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase();
    const results = allStudents.filter(
      student =>
        student.id !== currentUser?.id &&
        (student.full_name.toLowerCase().includes(query) ||
         student.username.toLowerCase().includes(query) ||
         student.email?.toLowerCase().includes(query))
    );
    setFilteredStudents(results);
  }, [searchQuery, allStudents, currentUser]);

  // Auto scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [groupMessages, privateChats, selectedUser]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [selectedUser]);

  const handleSelectUser = (user) => {
    setSelectedUser(user);
    setSidebarOpen(false); // Close sidebar on mobile when selecting user
    setSearchQuery(''); // Clear search
    setUnreadPrivate(prev => {
      const updated = { ...prev };
      delete updated[user.id];
      return updated;
    });
    if (!privateChats[user.id]) {
      setPrivateChats(prev => ({
        ...prev,
        [user.id]: { user, messages: [] }
      }));
    }
  };

  const handleBackToGroup = () => {
    setSelectedUser(null);
    setSearchQuery(''); // Clear search when going back to group
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !currentUser) return;

    const messageText = inputMessage.trim();

    if (selectedUser) {
      const tempId = 'temp_' + Date.now();
      const newMsg = {
        id: tempId,
        sender_id: currentUser.id,
        sender_name: currentUser.fullName || currentUser.username,
        receiver_id: selectedUser.id,
        receiver_name: selectedUser.full_name,
        message_text: messageText,
        is_read: true,
        created_at: new Date().toISOString(),
        pending: true
      };

      setPrivateChats(prev => {
        const existing = prev[selectedUser.id] || { user: selectedUser, messages: [] };
        return {
          ...prev,
          [selectedUser.id]: {
            ...existing,
            messages: [...existing.messages, newMsg]
          }
        };
      });

      socket.emit('private_message', {
        from: currentUser.id,
        fromName: currentUser.fullName || currentUser.username,
        toUserId: selectedUser.id,
        toUserName: selectedUser.full_name,
        text: messageText
      });
    } else {
      const tempId = 'temp_' + Date.now();
      const newMsg = {
        id: tempId,
        user_id: currentUser.id,
        username: currentUser.fullName || currentUser.username,
        message_text: messageText,
        created_at: new Date().toISOString(),
        pending: true
      };

      setGroupMessages(prev => [...prev, newMsg]);
      setPendingMessages(prev => new Set(prev).add(tempId));

      socket.emit('send_message', {
        userId: currentUser.id,
        username: currentUser.fullName || currentUser.username,
        text: messageText
      });
    }

    setInputMessage('');
    inputRef.current?.focus();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const isToday = date.toDateString() === new Date().toDateString();
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + 
           date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const currentMessages = selectedUser 
    ? (privateChats[selectedUser.id]?.messages || [])
    : groupMessages;

  if (!currentUser) {
    return (
      <div className="chat-page">
        <div className="chat-not-logged-in">
          <Icon icon={accountIcon} width="64" height="64" />
          <h2>Please Login First</h2>
          <p>You need to login to access the chat</p>
          <a href="/login" className="chat-login-link">Go to Login</a>
        </div>
      </div>
    );
  }

  // Separate online and offline users (excluding current user)
  const otherOnlineUsers = onlineUsers.filter(u => u.id !== currentUser?.id);
  const otherOfflineUsers = allStudents.filter(
    s => s.status !== 'online' && s.id !== currentUser?.id
  );

  return (
    <div className="chat-page">
      <div className="chat-page-container">
        {/* Sidebar */}
        <div className={`chat-sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="chat-sidebar-header">
            <h3><Icon icon={messageTextIcon} width="22" height="22" /> Messages</h3>
          </div>

          {/* NEW: Search Bar */}
          <div className="chat-sidebar-search">
            <div className="search-input-wrapper">
              <Icon icon={searchIcon} width="18" height="18" className="search-icon" />
              <input
                type="text"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="chat-sidebar-input"
              />
              {searchQuery && (
                <button
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Group Tab - Only show if not searching */}
          {!isSearching && (
            <button 
              className={`chat-tab group-tab ${!selectedUser ? 'active' : ''}`} 
              onClick={() => { handleBackToGroup(); setSidebarOpen(false); }}
            >
              <div className="tab-icon"><Icon icon={accountGroupIcon} width="22" height="22" /></div>
              <div className="tab-info">
                <span className="tab-name">Class Group</span>
                <span className="tab-preview">General chat for everyone</span>
              </div>
              <span className="online-badge">{onlineUsers.length}</span>
            </button>
          )}

          {/* Search Results */}
          {isSearching && filteredStudents.length > 0 && (
            <div className="search-results-section">
              <div className="section-header search-results-header">
                Search Results ({filteredStudents.length})
              </div>
              <div className="search-results-list">
                {filteredStudents.map(student => {
                  const isOnline = student.status === 'online';
                  return (
                    <button
                      key={student.id}
                      className={`search-result-item ${selectedUser?.id === student.id ? 'selected' : ''} ${unreadPrivate[student.id] ? 'has-unread' : ''}`}
                      onClick={() => handleSelectUser(student)}
                    >
                      <div className="user-avatar">
                        {student.photo ? 
                          <img src={student.photo} alt={student.full_name} /> : 
                          <div className="avatar-placeholder">
                            {student.full_name?.split(' ').map(n => n[0]).join('')}
                          </div>
                        }
                        {isOnline && <span className="online-dot"></span>}
                      </div>
                      <div className="user-info">
                        <div className="user-name-row">
                          <span className="user-name">{student.full_name}</span>
                          {unreadPrivate[student.id] && <span className="unread-dot"></span>}
                        </div>
                        <span className="user-last-msg">
                          {isOnline ? '🟢 Online' : '⚫ Offline'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No Search Results */}
          {isSearching && filteredStudents.length === 0 && (
            <div className="no-search-results">
              <Icon icon={searchIcon} width="32" height="32" />
              <p>No students found</p>
              <span>Try a different name or email</span>
            </div>
          )}

          {/* Online Users Section - Only show if not searching */}
          {!isSearching && (
            <>
              <div className="section-header">
                <Icon icon={circleIcon} width="10" height="10" style={{ color: '#10b981' }} />
                <span>Online Now • {otherOnlineUsers.length}</span>
              </div>

              <div className="online-users-list">
                {otherOnlineUsers.map(user => (
                  <button
                    key={user.id}
                    className={`online-user-item ${selectedUser?.id === user.id ? 'selected' : ''} ${unreadPrivate[user.id] ? 'has-unread' : ''}`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="user-avatar">
                      {user.photo ? <img src={user.photo} alt={user.full_name} /> : 
                        <div className="avatar-placeholder">{user.full_name?.split(' ').map(n => n[0]).join('')}</div>}
                      <span className="online-dot"></span>
                    </div>
                    <div className="user-info">
                      <div className="user-name-row">
                        <span className="user-name">{user.full_name}</span>
                        {unreadPrivate[user.id] && <span className="unread-dot"></span>}
                      </div>
                      <span className="user-last-msg">{user.role || 'Student'}</span>
                    </div>
                  </button>
                ))}
              </div>

              {/* Offline Users Section */}
              <div className="section-header offline">
                <span>Offline • {otherOfflineUsers.length}</span>
              </div>
              <div className="offline-users-list">
                {otherOfflineUsers.map(user => (
                  <button
                    key={user.id}
                    className={`offline-user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
                    onClick={() => handleSelectUser(user)}
                  >
                    <div className="user-avatar small">
                      {user.photo ? <img src={user.photo} alt={user.full_name} /> :
                        <div className="avatar-placeholder small">{user.full_name?.split(' ').map(n => n[0]).join('')}</div>}
                    </div>
                    <span className="user-name">{user.full_name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Main Chat */}
        <div className="chat-main">
          <div className="chat-main-header">
            {/* Mobile Sidebar Toggle Button */}
            <button 
              className="mobile-sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle sidebar"
              aria-expanded={sidebarOpen}
            >
              <Icon icon={menuIcon} width="22" height="22" />
            </button>

            {selectedUser ? (
              <div className="chat-header-private">
                <button className="back-btn-chat" onClick={handleBackToGroup}>
                  <Icon icon={arrowLeftIcon} width="22" height="22" />
                </button>
                <div className="user-avatar">
                  {selectedUser.photo ? <img src={selectedUser.photo} alt={selectedUser.full_name} /> :
                    <div className="avatar-placeholder">{selectedUser.full_name?.split(' ').map(n => n[0]).join('')}</div>}
                  {selectedUser.status === 'online' && <span className="online-dot"></span>}
                </div>
                <div className="header-user-info">
                  <h4>{selectedUser.full_name}</h4>
                  <span className={`status-text ${selectedUser.status}`}>
                    {selectedUser.status === 'online' ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="chat-header-group">
                <Icon icon={accountGroupIcon} width="22" height="22" />
                <div>
                  <h4>Class Group Chat</h4>
                  <span className="online-count-text">{onlineUsers.length} members online</span>
                </div>
              </div>
            )}
          </div>

          <div className="chat-messages" onClick={() => setSidebarOpen(false)}>
            {currentMessages.length === 0 ? (
              <div className="no-messages">
                <Icon icon={selectedUser ? accountIcon : accountGroupIcon} width="48" height="48" />
                <p>{selectedUser ? `Start a conversation with ${selectedUser.full_name?.split(' ')[0]}` : 'No messages yet. Start the conversation!'}</p>
              </div>
            ) : (
              currentMessages.map((msg, i) => {
                const isOwn = msg.user_id === currentUser?.id || 
                             msg.sender_id === currentUser?.id || 
                             msg.pending;
                
                return (
                  <div key={msg.id || i} className={`message-wrapper ${isOwn ? 'own' : 'other'}`}>
                    {!isOwn && !selectedUser && (
                      <span className="message-sender-name">{msg.username || msg.sender_name}</span>
                    )}
                    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
                      <p>{msg.message_text || msg.text}</p>
                      <span className="message-time">
                        {msg.pending ? 'Sending...' : formatTime(msg.created_at || msg.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={selectedUser ? `Message ${selectedUser.full_name?.split(' ')[0]}...` : 'Type a message to everyone...'}
              className="chat-input"
            />
            <button type="submit" className="send-btn" disabled={!inputMessage.trim()}>
              <Icon icon={sendIcon} width="20" height="20" />
            </button>
          </form>
        </div>

        {/* Mobile overlay when sidebar is open */}
        {sidebarOpen && (
          <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        )}
      </div>
    </div>
  );
};

export default ChatPage;