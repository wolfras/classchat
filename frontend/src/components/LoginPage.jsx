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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isLandscape, setIsLandscape] = useState(window.innerHeight < window.innerWidth);
  
  const usernameInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLandscape(window.innerHeight < window.innerWidth);
    };
    const handleOrientationChange = () => {
      setTimeout(() => { setIsLandscape(window.innerHeight < window.innerWidth); }, 100);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, []);

  useEffect(() => { usernameInputRef.current?.focus(); }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedUsername = username.trim();
    
    if (!trimmedUsername) {
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
      const res = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: trimmedUsername, password }),
      });

      const data = await res.json();

      if (data.success) {
        setCurrentUser(data.user);
        navigate(data.user.isAdmin ? '/admin' : '/');
      } else {
        setError(data.message || 'Invalid username or password');
        setTimeout(() => usernameInputRef.current?.focus(), 100);
      }
    } catch (err) {
      setError('Connection error. Please check your internet.');
      setTimeout(() => usernameInputRef.current?.focus(), 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="login-page-container">
        <Link to="/" className="back-home-btn" aria-label="Back to Home">
          <Icon icon={arrowLeftIcon} width="20" height="20" aria-hidden="true" />
          Back to Home
        </Link>

        <div className="login-page-content login-single-column">
          <div className="login-form-section login-form-centered">
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
                  <Icon icon={accountIcon} width="18" height="18" aria-hidden="true" />
                  Username or Email
                </label>
                <input
                  id="username"
                  ref={usernameInputRef}
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username or email"
                  required
                  aria-label="Username or Email"
                  aria-describedby={error ? 'error-message' : undefined}
                  disabled={loading}
                  spellCheck="false"
                  autoCorrect="off"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">
                  <Icon icon={lockIcon} width="18" height="18" aria-hidden="true" />
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
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="login-error" id="error-message" role="alert" aria-live="polite">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
                aria-busy={loading}
                aria-label={loading ? 'Signing in' : 'Sign In'}
              >
                <Icon icon={loginIcon} width="20" height="20" aria-hidden="true" />
                {loading ? 'Signing in...' : 'Sign In'}
              </button>

              <div className="register-link">
                <p>Don't have an account? <Link to="/register">Register here</Link></p>
                <p className="register-note">*Registration requires admin approval</p>
              </div>
              <div className="forgot-password-link">
                <Link to="/forgot-password">Forgot Password?</Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;