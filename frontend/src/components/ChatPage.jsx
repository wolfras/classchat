import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Icon } from '@iconify/react';
import sendIcon from '@iconify/icons-mdi/send';
import accountGroupIcon from '@iconify/icons-mdi/account-group';
import circleIcon from '@iconify/icons-mdi/circle';
import accountIcon from '@iconify/icons-mdi/account';
import messageTextIcon from '@iconify/icons-mdi/message-text';
import arrowLeftIcon from '@iconify/icons-mdi/arrow-left';
import './ChatPage.css';

const SOCKET_URL = 'http://localhost:3001';

const ChatPage = ({ isDarkTheme, currentUser }) => {
  const [socket, setSocket] = useState(null);
  const [groupMessages, setGroupMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [privateChats, setPrivateChats] = useState({});
  const [unreadPrivate, setUnreadPrivate] = useState({});
  const [pendingMessages, setPendingMessages] = useState(new Set()); // Track pending message IDs
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

    // Group message history
    newSocket.on('message_history', (history) => {
      console.log('📜 Group history loaded:', history.length, 'messages');
      setGroupMessages(history || []);
    });

    // New group message (from others)
    newSocket.on('new_message', (msg) => {
      // Don't add if it's our own confirmed message
      if (msg.confirmed) {
        // Remove from pending
        setPendingMessages(prev => {
          const updated = new Set(prev);
          updated.delete(msg.id);
          return updated;
        });
        return;
      }
      
      // Only add if not already in the list
      setGroupMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    // Private message history
    newSocket.on('private_message_history', (history) => {
      console.log('📜 Private history loaded:', history.length, 'messages');
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

    // Incoming private message (from other user)
    newSocket.on('private_message', (msg) => {
      console.log('📩 Received private message from:', msg.sender_name);
      const otherUserId = msg.sender_id;
      
      setPrivateChats(prev => {
        const existing = prev[otherUserId] || { user: null, messages: [] };
        // Check if message already exists
        if (existing.messages.some(m => m.id === msg.id)) return prev;
        return {
          ...prev,
          [otherUserId]: {
            ...existing,
            messages: [...existing.messages, msg]
          }
        };
      });

      // Show unread indicator
      if (!selectedUser || selectedUser.id !== otherUserId) {
        setUnreadPrivate(prev => ({ ...prev, [otherUserId]: true }));
      }
    });

    // Confirmation that our private message was sent
    newSocket.on('private_message_sent', (data) => {
      console.log('✅ Message sent confirmation:', data.id, 'Delivered:', data.delivered);
    });

    // Student updates
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
    fetch('http://localhost:3001/api/students')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setAllStudents(data.students);
          setOnlineUsers(data.students.filter(s => s.status === 'online'));
        }
      })
      .catch(err => console.error('Error:', err));
  }, [currentUser]);

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

  const handleBackToGroup = () => setSelectedUser(null);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !socket || !currentUser) return;

    const messageText = inputMessage.trim();

    if (selectedUser) {
      // PRIVATE MESSAGE
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

      // Add to local state immediately
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

      // Send via socket
      socket.emit('private_message', {
        from: currentUser.id,
        fromName: currentUser.fullName || currentUser.username,
        toUserId: selectedUser.id,
        toUserName: selectedUser.full_name,
        text: messageText
      });
    } else {
      // GROUP MESSAGE
      const tempId = 'temp_' + Date.now();
      const newMsg = {
        id: tempId,
        user_id: currentUser.id,
        username: currentUser.fullName || currentUser.username,
        message_text: messageText,
        created_at: new Date().toISOString(),
        pending: true
      };

      // Add to local state immediately
      setGroupMessages(prev => [...prev, newMsg]);
      setPendingMessages(prev => new Set(prev).add(tempId));

      // Send via socket
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

  return (
    <div className="chat-page">
      <div className="chat-page-container">
        {/* Sidebar - same as before */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h3><Icon icon={messageTextIcon} width="22" height="22" /> Messages</h3>
          </div>

          <button className={`chat-tab group-tab ${!selectedUser ? 'active' : ''}`} onClick={handleBackToGroup}>
            <div className="tab-icon"><Icon icon={accountGroupIcon} width="22" height="22" /></div>
            <div className="tab-info">
              <span className="tab-name">Class Group</span>
              <span className="tab-preview">General chat for everyone</span>
            </div>
            <span className="online-badge">{onlineUsers.length}</span>
          </button>

          <div className="section-header">
            <Icon icon={circleIcon} width="10" height="10" style={{ color: '#10b981' }} />
            <span>Online Now • {onlineUsers.length}</span>
          </div>

          <div className="online-users-list">
            {onlineUsers.filter(u => u.id !== currentUser?.id).map(user => (
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

          <div className="section-header offline">
            <span>Offline • {allStudents.filter(s => s.status !== 'online').length}</span>
          </div>
          <div className="offline-users-list">
            {allStudents.filter(s => s.status !== 'online' && s.id !== currentUser?.id).slice(0, 15).map(user => (
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
        </div>

        {/* Main Chat */}
        <div className="chat-main">
          <div className="chat-main-header">
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

          <div className="chat-messages">
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
      </div>
    </div>
  );
};

export default ChatPage;