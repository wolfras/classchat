import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import lockIcon from '@iconify/icons-mdi/lock';
import accountIcon from '@iconify/icons-mdi/account';
import arrowLeftIcon from '@iconify/icons-mdi/arrow-left';
import keyIcon from '@iconify/icons-mdi/key';
import { API_URL } from '../config';
import './LoginPage.css';

const ForgotPassword = ({ isDarkTheme }) => {
  const [step, setStep] = useState(1); // 1 = request, 2 = reset
  const [username, setUsername] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetInfo, setResetInfo] = useState(null);

  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: username.trim() })
      });
      const data = await res.json();
      
      if (data.success) {
        setResetInfo(data);
        setStep(2);
        setSuccess('Reset token generated! Enter the token below with your new password.');
      } else {
        setError(data.message || 'Request failed');
      }
    } catch (err) {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: resetInfo?.username || username.trim(),
          token: token.trim().toUpperCase(),
          newPassword: newPassword
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setSuccess('Password reset successfully! You can now login.');
        setTimeout(() => window.location.href = '/login', 2000);
      } else {
        setError(data.message || 'Reset failed');
      }
    } catch (err) {
      setError('Connection error');
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
                <Icon icon={keyIcon} width="32" height="32" />
              </div>
              <h1>{step === 1 ? 'Forgot Password' : 'Reset Password'}</h1>
              <p>{step === 1 ? 'Enter your username or email to receive a reset token' : 'Enter the reset token and your new password'}</p>
            </div>

            {step === 1 ? (
              <form onSubmit={handleRequestReset} className="login-form">
                <div className="form-group">
                  <label><Icon icon={accountIcon} width="18" height="18" />Username or Email</label>
                  <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username or email" required />
                </div>
                {error && <div className="login-error">{error}</div>}
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Sending...' : 'Get Reset Token'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="login-form">
                <div className="form-group">
                  <label><Icon icon={keyIcon} width="18" height="18" />Reset Token</label>
                  <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="Enter the reset token" required />
                </div>
                <div className="form-group">
                  <label><Icon icon={lockIcon} width="18" height="18" />New Password</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password (min 6 chars)" required />
                </div>
                <div className="form-group">
                  <label><Icon icon={lockIcon} width="18" height="18" />Confirm Password</label>
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm new password" required />
                </div>
                {error && <div className="login-error">{error}</div>}
                {success && <div className="login-success">{success}</div>}
                <button type="submit" className="login-submit-btn" disabled={loading}>
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;