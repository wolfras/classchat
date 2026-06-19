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

    // Validation
    if (!formData.fullName || !formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username.toLowerCase(),
          email: formData.email.toLowerCase(),
          password: formData.password
        })
      });

      const data = await res.json();

      if (data.success) {
        setSuccess('Registration submitted! Please wait for admin approval. You will be notified when approved.');
        setTimeout(() => navigate('/login'), 3000);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`login-page ${isDarkTheme ? 'dark' : 'light'}`}>
      <div className="login-page-container">
        <Link to="/login" className="back-home-btn">
          <Icon icon={arrowLeftIcon} width="20" height="20" />
          Back to Login
        </Link>

        <div className="login-page-content login-single-column">
          <div className="login-form-section login-form-centered">
            <div className="login-form-header">
              <div className="login-icon-wrapper">
                <Icon icon={accountIcon} width="32" height="32" />
              </div>
              <h1>Create Account</h1>
              <p>Register to join the class chat. Admin approval required.</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              <div className="form-group">
                <label><Icon icon={accountIcon} width="18" height="18" />Full Name</label>
                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Enter your full name" required />
              </div>

              <div className="form-group">
                <label><Icon icon={accountIcon} width="18" height="18" />Username</label>
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Choose a username" required />
              </div>

              <div className="form-group">
                <label><Icon icon={emailIcon} width="18" height="18" />Email</label>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter your email" required />
              </div>

              <div className="form-group">
                <label><Icon icon={lockIcon} width="18" height="18" />Password</label>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Create a password (min 6 characters)" required />
              </div>

              <div className="form-group">
                <label><Icon icon={lockIcon} width="18" height="18" />Confirm Password</label>
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm your password" required />
              </div>

              {error && <div className="login-error">{error}</div>}
              {success && <div className="login-success">{success}</div>}

              <button type="submit" className="login-submit-btn" disabled={loading}>
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