import React, { useState, useEffect, useRef } from 'react';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLandscape, setIsLandscape] = useState(
    window.innerHeight < window.innerWidth
  );
  
  const usernameInputRef = useRef(null);
  const quickLoginGridRef = useRef(null);

  // Handle responsive resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLandscape(window.innerHeight < window.innerWidth);
    };

    const handleOrientationChange = () => {
      setTimeout(() => {
        setIsLandscape(window.innerHeight < window.innerWidth);
      }, 100);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  // Fetch members
  useEffect(() => {
    fetchMembers();
  }, []);

  // Focus management for accessibility
  useEffect(() => {
    usernameInputRef.current?.focus();
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
    
    // Validation
    if (!username.trim()) {
      setError('Please enter your username');
      usernameInputRef.current?.focus();
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    setLoading(true);

    try {
      console.log('Attempting login with:', username);

      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: username.trim(),
          password: password,
        }),
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
        // Focus back on username for accessibility
        setTimeout(() => usernameInputRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(
        'Connection error. Make sure backend is running on port 3001'
      );
      setTimeout(() => usernameInputRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (member, index) => {
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
          password: 'student123',
        }),
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

  const handleQuickLoginKeyboard = (member, e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleQuickLogin(member);
    }
  };

  const handleImageError = (e, name) => {
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || 'User'
    )}&background=7c3aed&color=fff&size=128`;
  };

  // Smooth scroll to quick login on mobile
  const scrollToQuickLogin = () => {
    if (isMobile && quickLoginGridRef.current) {
      quickLoginGridRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className={`login-page ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="login-page-container">
        {/* Back Button */}
        <Link to="/" className="back-home-btn" aria-label="Back to Home">
          <Icon icon={arrowLeftIcon} width="20" height="20" aria-hidden="true" />
          Back to Home
        </Link>

        <div className="login-page-content">
          {/* Left Side - Login Form */}
          <div className="login-form-section">
            <div className="login-form-header">
              <div className="login-icon-wrapper" aria-hidden="true">
                <Icon icon={lockIcon} width="32" height="32" />
              </div>
              <h1>Welcome Back</h1>
              <p>Sign in to access your class portfolio and chat</p>
            </div>

            <form onSubmit={handleLogin} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="username">
                  <Icon
                    icon={accountIcon}
                    width="18"
                    height="18"
                    aria-hidden="true"
                  />
                  Username
                </label>
                <input
                  id="username"
                  ref={usernameInputRef}
                  type="text"
                  inputMode="email"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username "
                  required
                  aria-label="Username"
                  aria-describedby={error ? 'error-message' : undefined}
                  disabled={loading}
                  spellCheck="false"
                  autoCorrect="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <Icon
                    icon={lockIcon}
                    width="18"
                    height="18"
                    aria-hidden="true"
                  />
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  aria-label="Password"
                  aria-describedby={error ? 'error-message' : undefined}
                  disabled={loading}
                />
              </div>

              {error && (
                <div
                  className="login-error"
                  id="error-message"
                  role="alert"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
                aria-busy={loading}
                aria-label={
                  loading ? 'Signing in' : 'Sign In'
                }
              >
                <Icon
                  icon={loginIcon}
                  width="20"
                  height="20"
                  aria-hidden="true"
                />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>

            {/* Show hint about quick login on mobile */}
            {isMobile && members.length > 0 && (
              <div className="login-help">
                <p>
                  <strong>Tip:</strong> Scroll down to see quick login options
                  or enter your credentials above.
                </p>
              </div>
            )}
          </div>

          {/* Right Side - Quick Login */}
          <div className="quick-login-section">
            <h3 aria-label="Quick Login Section">
              <Icon icon={accountIcon} width="24" height="24" aria-hidden="true" />
              Quick Login
            </h3>
            <p>Select your profile to login instantly</p>

            {membersLoading ? (
              <p className="quick-login-loading" aria-live="polite">
                Loading members...
              </p>
            ) : members.length === 0 ? (
              <p className="quick-login-empty" role="status">
                No members found. Is the backend running?
              </p>
            ) : (
              <div
                className="quick-login-grid"
                ref={quickLoginGridRef}
                role="group"
                aria-label="Available user profiles"
              >
                {members.slice(0, 12).map((member, index) => (
                  <button
                    key={member.id}
                    onClick={() => {
                      handleQuickLogin(member, index);
                    }}
                    onKeyDown={(e) => handleQuickLoginKeyboard(member, e)}
                    className="quick-login-card"
                    title={`Login as ${member.name}`}
                    aria-label={`Login as ${member.name}, ${member.role || 'Student'}`}
                    disabled={loading}
                    type="button"
                  >
                    <img
                      src={member.avatar}
                      alt={member.name}
                      onError={(e) => handleImageError(e, member.name)}
                      loading="lazy"
                      decoding="async"
                    />
                    <span className="quick-login-name">
                      {member.name?.split(' ')[0]}
                    </span>
                    <span className="quick-login-role">
                      {member.role || 'Student'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            <p className="quick-login-hint">
              Click on your profile picture to login instantly with default
              password
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
