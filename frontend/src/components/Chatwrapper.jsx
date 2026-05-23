import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';
import { SOCKET_URL } from '../config';


const ChatWrapper = ({ isDarkTheme, currentUser, setCurrentUser, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showLogin, setShowLogin] = useState(!currentUser);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [members, setMembers] = useState([]);

  // Fetch members for quick login
  useEffect(() => {
   fetch(`${API_URL}/api/members`)
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(err => console.error('Error fetching members:', err));
  }, []);

  // Connect socket when user is logged in
  useEffect(() => {
    if (currentUser && !socket) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      newSocket.emit('user_join', {
        id: currentUser.id,
        name: currentUser.name || currentUser.username
      });

      newSocket.on('message_history', (history) => {
        setMessages(history);
      });

      newSocket.on('new_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      return () => {
        newSocket.disconnect();
      };
    }
  }, [currentUser]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');

    try {
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: loginUsername, 
          password: loginPassword 
        })
      });

      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.user);
        setShowLogin(false);
      } else {
        // Try login by ID if email fails
        tryIdLogin();
      }
    } catch (err) {
      setLoginError('Connection error');
    }
  };

  const tryIdLogin = async () => {
    // Find member by name
    const member = members.find(m => 
      m.name.toLowerCase().includes(loginUsername.toLowerCase())
    );

    if (member) {
      try {
        const res = await fetch(`${API_URL}/api/login/${member.id}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: loginPassword })
        });

        const data = await res.json();
        if (data.success) {
          setCurrentUser(data.user);
          setShowLogin(false);
        } else {
          setLoginError('Invalid credentials');
        }
      } catch (err) {
        setLoginError('Login failed');
      }
    } else {
      setLoginError('User not found');
    }
  };

  const handleQuickLogin = async (member) => {
    try {
      const res = await fetch(`${API_URL}/api/login/${member.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: member.password || '123' })
      });

      const data = await res.json();
      if (data.success) {
        setCurrentUser(data.user);
        setShowLogin(false);
      }
    } catch (err) {
      console.error('Quick login error:', err);
    }
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket && currentUser) {
      socket.emit('send_message', {
        userId: currentUser.id,
        userName: currentUser.name || currentUser.username,
        text: inputMessage.trim()
      });
      setInputMessage('');
    }
  };

  return (
    <div className="chat-wrapper">
      {/* Chat Header */}
      <div className="chat-header">
        <h3>💬 Class Chat</h3>
        <button onClick={onClose} className="chat-close-btn">✕</button>
      </div>

      {showLogin ? (
        /* Login Form */
        <div className="chat-login">
          <h4>Login to Chat</h4>
          <form onSubmit={handleLogin}>
            <input
              type="text"
              placeholder="Email or Name"
              value={loginUsername}
              onChange={(e) => setLoginUsername(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              required
            />
            {loginError && <p className="error-msg">{loginError}</p>}
            <button type="submit">Login</button>
          </form>

          {/* Quick Login */}
          <div className="quick-login">
            <p>Quick Login:</p>
            <div className="quick-login-list">
              {members.slice(0, 8).map((member, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickLogin(member)}
                  className="quick-login-btn"
                >
                  {member.name?.split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Chat Messages */
        <>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`message ${msg.userId === currentUser?.id ? 'sent' : 'received'}`}
              >
                <strong>{msg.userName}</strong>
                <p>{msg.text}</p>
                <span className="time">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))}
          </div>

          {/* Message Input */}
          <form onSubmit={handleSendMessage} className="chat-input-form">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <button type="submit">Send</button>
          </form>
        </>
      )}

      <style>{`
        .chat-wrapper {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 380px;
          height: 520px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 16px;
          display: flex;
          flex-direction: column;
          z-index: 9999;
          box-shadow: 0 10px 40px rgba(0,0,0,0.5);
        }
        .chat-header {
          background: #7c3aed;
          color: white;
          padding: 12px 16px;
          border-radius: 16px 16px 0 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .chat-header h3 {
          margin: 0;
          font-size: 16px;
        }
        .chat-close-btn {
          background: rgba(255,255,255,0.2);
          border: none;
          color: white;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          cursor: pointer;
        }
        .chat-login {
          padding: 20px;
          flex: 1;
          overflow-y: auto;
        }
        .chat-login h4 {
          color: white;
          text-align: center;
          margin-bottom: 15px;
        }
        .chat-login input {
          width: 100%;
          padding: 10px;
          margin-bottom: 10px;
          border: 1px solid #444;
          border-radius: 8px;
          background: #2a2a2a;
          color: white;
          font-size: 14px;
        }
        .chat-login button[type="submit"] {
          width: 100%;
          padding: 10px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
        }
        .error-msg {
          color: #ef4444;
          font-size: 13px;
          text-align: center;
        }
        .quick-login {
          margin-top: 15px;
        }
        .quick-login p {
          color: #999;
          font-size: 12px;
          text-align: center;
          margin-bottom: 8px;
        }
        .quick-login-list {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          justify-content: center;
        }
        .quick-login-btn {
          padding: 5px 12px;
          background: #2a2a2a;
          border: 1px solid #444;
          border-radius: 15px;
          color: #ccc;
          cursor: pointer;
          font-size: 12px;
        }
        .quick-login-btn:hover {
          background: #7c3aed;
          color: white;
          border-color: #7c3aed;
        }
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 15px;
        }
        .message {
          margin-bottom: 10px;
          padding: 10px;
          border-radius: 10px;
          max-width: 80%;
        }
        .message.sent {
          background: #7c3aed;
          color: white;
          margin-left: auto;
        }
        .message.received {
          background: #2a2a2a;
          color: white;
        }
        .message strong {
          font-size: 12px;
          display: block;
          margin-bottom: 3px;
          opacity: 0.8;
        }
        .message p {
          margin: 0;
          font-size: 14px;
        }
        .message .time {
          font-size: 10px;
          opacity: 0.6;
          display: block;
          text-align: right;
          margin-top: 3px;
        }
        .chat-input-form {
          padding: 10px 15px;
          display: flex;
          gap: 8px;
          border-top: 1px solid #333;
        }
        .chat-input-form input {
          flex: 1;
          padding: 10px;
          border: 1px solid #444;
          border-radius: 20px;
          background: #2a2a2a;
          color: white;
          font-size: 14px;
        }
        .chat-input-form button {
          padding: 10px 20px;
          background: #7c3aed;
          color: white;
          border: none;
          border-radius: 20px;
          cursor: pointer;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};

export default ChatWrapper;