import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import accountIcon from '@iconify/icons-mdi/account';
import lockIcon from '@iconify/icons-mdi/lock';
import emailIcon from '@iconify/icons-mdi/email';
import arrowLeftIcon from '@iconify/icons-mdi/arrow-left';
import { API_URL } from '../config';
import './LoginPage.css';

const Register = ({ isDarkTheme }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Trim all inputs
    const trimmedData = {
      fullName: formData.fullName.trim(),
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword
    };

    // Validation
    if (!trimmedData.fullName || !trimmedData.username || !trimmedData.email || !trimmedData.password) {
      setError('All fields are required');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (trimmedData.password !== trimmedData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (trimmedData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    // Username validation
    if (trimmedData.username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    if (!/^[a-zA-Z0-9._]+$/.test(trimmedData.username)) {
      setError('Username can only contain letters, numbers, dots, and underscores');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedData.fullName,
          username: trimmedData.username,
          email: trimmedData.email,
          password: trimmedData.password
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Registration submitted! Please wait for admin approval.');
        // Don't auto-redirect - let user read the message
        setTimeout(() => navigate('/login'), 5000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please check your internet and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="login-page-container">
        <Link to="/login" className="back-home-btn" aria-label="Back to Login">
          <Icon icon={arrowLeftIcon} width="20" height="20" aria-hidden="true" />
          Back to Login
        </Link>

        <div className="login-page-content login-single-column">
          <div className="login-form-section login-form-centered">
            <div className="login-form-header">
              <div className="login-icon-wrapper" aria-hidden="true">
                <Icon icon={accountIcon} width="32" height="32" />
              </div>
              <h1>Create Account</h1>
              <p>Register to join the class chat. Admin approval required.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form" noValidate>
              <div className="form-group">
                <label htmlFor="reg-fullname">
                  <Icon icon={accountIcon} width="18" height="18" aria-hidden="true" />
                  Full Name
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  required
                  aria-label="Full Name"
                  disabled={loading}
                  autoComplete="name"
                  spellCheck="false"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-username">
                  <Icon icon={accountIcon} width="18" height="18" aria-hidden="true" />
                  Username
                </label>
                <input
                  id="reg-username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a username"
                  required
                  aria-label="Username"
                  disabled={loading}
                  autoComplete="username"
                  spellCheck="false"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-email">
                  <Icon icon={emailIcon} width="18" height="18" aria-hidden="true" />
                  Email
                </label>
                <input
                  id="reg-email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  required
                  aria-label="Email"
                  disabled={loading}
                  autoComplete="email"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-password">
                  <Icon icon={lockIcon} width="18" height="18" aria-hidden="true" />
                  Password
                </label>
                <input
                  id="reg-password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password (min 6 characters)"
                  required
                  aria-label="Password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              <div className="form-group">
                <label htmlFor="reg-confirm-password">
                  <Icon icon={lockIcon} width="18" height="18" aria-hidden="true" />
                  Confirm Password
                </label>
                <input
                  id="reg-confirm-password"
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  required
                  aria-label="Confirm Password"
                  disabled={loading}
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="login-error" role="alert" aria-live="polite">
                  {error}
                </div>
              )}
              {success && (
                <div className="login-success" role="status" aria-live="polite">
                  {success}
                </div>
              )}

              <button
                type="submit"
                className="login-submit-btn"
                disabled={loading}
                aria-busy={loading}
                aria-label={loading ? 'Submitting registration' : 'Register'}
              >
                {loading ? 'Submitting...' : 'Register'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;