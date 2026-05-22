import React, { useState, useEffect } from 'react';
import { Icon } from '@iconify/react';
import loginIcon from '@iconify/icons-mdi/login';
import accountIcon from '@iconify/icons-mdi/account';
import './ChatLogin.css';

const ChatLogin = ({ onLoginSuccess, isDarkTheme }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/students')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setUsers(data.students);
        }
      })
      .catch(err => console.error('Error:', err));
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password })
      });
      
      const data = await res.json();
      
      if (data.success) {
        onLoginSuccess(data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (studentName) => {
    setUsername(studentName.toLowerCase().split(' ')[0]);
    setPassword('student123');
  };

  return (
    <div className="chat-login">
      <div className="chat-login-header">
        <Icon icon={accountIcon} width="40" height="40" />
        <h4>Login to Chat</h4>
        <p>Connect with your classmates</p>
      </div>

      <form onSubmit={handleLogin} className="chat-login-form">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="chat-login-error">{error}</p>}
        <button type="submit" disabled={loading} className="chat-login-btn">
          <Icon icon={loginIcon} width="18" height="18" />
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>

      <div className="quick-login-section">
        <p>Quick Login</p>
        <div className="quick-login-list">
          {users.slice(0, 6).map((user, i) => (
            <button
              key={i}
              onClick={() => quickLogin(user.full_name)}
              className="quick-login-item"
            >
              {user.full_name?.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatLogin;