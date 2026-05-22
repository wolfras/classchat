import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Icon } from '@iconify/react';
import closeIcon from '@iconify/icons-mdi/close';
import sendIcon from '@iconify/icons-mdi/send';
import chatIcon from '@iconify/icons-mdi/chat';
import ChatLogin from './ChatLogin';
import './Chat.css';

const SOCKET_URL = 'http://localhost:3001';

const Chat = ({ isDarkTheme, currentUser, setCurrentUser, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [showLogin, setShowLogin] = useState(!currentUser);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);
      
      newSocket.emit('user_join', { id: currentUser.id, name: currentUser.username });
      
      newSocket.on('message_history', (history) => {
        setMessages(history);
      });
      
      newSocket.on('new_message', (msg) => {
        setMessages(prev => [...prev, msg]);
      });

      return () => newSocket.disconnect();
    }
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && socket) {
      socket.emit('send_message', {
        userId: currentUser.id,
        username: currentUser.username,
        text: inputMessage.trim()
      });
      setInputMessage('');
    }
  };

  const handleLoginSuccess = (user) => {
    setCurrentUser(user);
    setShowLogin(false);
  };

  return (
    <div className={`chat-widget ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="chat-widget-header">
        <div className="chat-header-left">
          <Icon icon={chatIcon} width="22" height="22" />
          <h3>Class Chat</h3>
        </div>
        <button onClick={onClose} className="chat-close-btn">
          <Icon icon={closeIcon} width="20" height="20" />
        </button>
      </div>

      {showLogin ? (
        <ChatLogin onLoginSuccess={handleLoginSuccess} isDarkTheme={isDarkTheme} />
      ) : (
        <>
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div
                key={msg.id || i}
                className={`message ${msg.user_id === currentUser?.id ? 'sent' : 'received'}`}
              >
                <span className="message-sender">{msg.username}</span>
                <p className="message-text">{msg.message_text}</p>
                <span className="message-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="chat-input-area">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your message..."
              className="chat-input"
            />
            <button type="submit" className="send-btn">
              <Icon icon={sendIcon} width="20" height="20" />
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default Chat;