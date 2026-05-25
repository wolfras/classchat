import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import loginIcon from '@iconify/icons-mdi/login';
import accountIcon from '@iconify/icons-mdi/account';
import lockIcon from '@iconify/icons-mdi/lock';
import arrowLeftIcon from '@iconify/icons-mdi/arrow-left';
import { API_URL } from '../config';
import './LoginPage.css';

const LoginPage = ({ isDarkTheme, setCurrentUser }) => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch(`${API_URL}/api/members`);
      if (!res.ok) {
        throw new Error('Failed to fetch members');
      }
      const data = await res.json();
      console.log('Members loaded:', data.length);
      setMembers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching members:', err);
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', username);
      
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: username.trim(),
          password: password 
        })
      });

      const data = await res.json();
      console.log('Login response:', data);

      if (data.success) {
        setCurrentUser(data.user);
        
        // If admin, redirect to admin page
        if (data.user.isAdmin) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        setError(data.message || 'Invalid username or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Make sure backend is running on port 3001');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (member) => {
    setError('');
    setLoading(true);
    
    try {
      console.log('Quick login for:', member.name);
      
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          email: member.username || member.name,
          password: 'student123'
        })
      });

      const data = await res.json();
      console.log('Quick login response:', data);

      if (data.success) {
        setCurrentUser(data.user);
        navigate('/');
      } else {
        setError('Quick login failed. Please enter password manually.');
      }
    } catch (err) {
      console.error('Quick login error:', err);
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="login-page-container">
        {/* Back Button */}
        <Link to="/" className="back-home-btn">
          <Icon icon={arrowLeftIcon} width="20" height="20" />
          Back to Home
        </Link>

        <div className="login-page-content">
          {/* Left Side - Login Form */}
          <div className="login-form-section">
            <div className="login-form-header">
              <div className="login-icon-wrapper">
                <Icon icon={lockIcon} width="32" height="32" />
              </div>
              <h1>Welcome Back</h1>
              <p>Sign in to access your class portfolio and chat</p>
            </div>

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label>
                  <Icon icon={accountIcon} width="18" height="18" />
                  Username
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username (e.g., admin or mugisha.ishaqa)"
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label>
                  <Icon icon={lockIcon} width="18" height="18" />
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && (
                <div className="login-error">
                  {error}
                </div>
              )}

              <button type="submit" className="login-submit-btn" disabled={loading}>
                <Icon icon={loginIcon} width="20" height="20" />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              
            </form>
          </div>

          {/* Right Side - Quick Login */}
          <div className="quick-login-section">
            <h3>
              <Icon icon={accountIcon} width="24" height="24" />
              Quick Login
            </h3>
            <p>Select your profile to login instantly</p>
            
            {membersLoading ? (
              <p className="quick-login-loading">Loading members...</p>
            ) : members.length === 0 ? (
              <p className="quick-login-empty">No members found. Is the backend running?</p>
            ) : (
              <div className="quick-login-grid">
                {members.slice(0, 12).map((member) => (
                  <button
                    key={member.id}
                    onClick={() => handleQuickLogin(member)}
                    className="quick-login-card"
                    title={`Login as ${member.name}`}
                  >
                    <img 
                      src={member.avatar} 
                      alt={member.name}
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || 'User')}&background=7c3aed&color=fff`;
                      }}
                    />
                    <span className="quick-login-name">{member.name?.split(' ')[0]}</span>
                    <span className="quick-login-role">{member.role || 'Student'}</span>
                  </button>
                ))}
              </div>
            )}

            <p className="quick-login-hint">
              Click on your profile picture to login instantly with default password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;