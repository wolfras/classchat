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
  const [isLandscape, setIsLandscape] = useState(
    window.innerHeight < window.innerWidth
  );
  
  const usernameInputRef = useRef(null);

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

  // Focus management for accessibility
  useEffect(() => {
    usernameInputRef.current?.focus();
  }, []);

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
        setTimeout(() => usernameInputRef.current?.focus(), 100);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Connection error. Make sure backend is running on port 3001');
      setTimeout(() => usernameInputRef.current?.focus(), 100);
    } finally {
      setLoading(false);
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

        <div className="login-page-content login-single-column">
          {/* Login Form */}
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
                  placeholder="Enter your username"
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
                  aria-describedby={error ? 'error-message' : undefined}
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="login-error" id="error-message" role="alert" aria-live="polite">
                  {error}
                </div>
              )}
  <div className="register-link">
  <p>Don't have an account? <Link to="/register">Register here</Link></p>
  <p className="register-note">*Registration requires admin approval</p>
</div>
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
            </form>

          
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;