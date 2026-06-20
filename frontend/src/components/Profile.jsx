import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '@iconify/react';
import accountIcon from '@iconify/icons-mdi/account';
import emailIcon from '@iconify/icons-mdi/email';
import shieldIcon from '@iconify/icons-mdi/shield';
import pencilIcon from '@iconify/icons-mdi/pencil';
import checkCircleIcon from '@iconify/icons-mdi/check-circle';
import circleOutlineIcon from '@iconify/icons-mdi/circle-outline';
import starIcon from '@iconify/icons-mdi/star';
import chatIcon from '@iconify/icons-mdi/chat';
import lockIcon from '@iconify/icons-mdi/lock';
import keyIcon from '@iconify/icons-mdi/key';
import arrowLeftIcon from '@iconify/icons-mdi/arrow-left';
import { API_URL } from '../config';
import './Profile.css';

const Profile = ({ isDarkTheme, currentUser, setCurrentUser }) => {
  const [studentData, setStudentData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('info');
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: '', bio: '', email: '' });
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  useEffect(() => {
    if (currentUser) {
      fetchStudentData();
    }
  }, [currentUser]);

  const fetchStudentData = async () => {
    try {
      const res = await fetch(`${API_URL}/api/students/${currentUser.id}`);
      const data = await res.json();
      if (data.success) {
        setStudentData(data.student);
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      full_name: studentData?.full_name || currentUser?.fullName || '',
      bio: studentData?.bio || '',
      email: studentData?.email || ''
    });
    setEditing(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const res = await fetch(`${API_URL}/api/admin/students/${currentUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          full_name: editForm.full_name,
          bio: editForm.bio,
          email: editForm.email
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setStudentData(data.student);
        setEditing(false);
        showMessage('Profile updated!', 'success');
      } else {
        showMessage(data.message || 'Update failed', 'error');
      }
    } catch (err) {
      showMessage('Connection error', 'error');
    }
  };

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3000);
  };

  if (!currentUser) {
    return (
      <div className="profile-page">
        <div className="profile-not-logged-in">
          <Icon icon={accountIcon} width="64" height="64" />
          <h2>Please Login First</h2>
          <p>You need to login to view your profile</p>
          <Link to="/login" className="profile-login-link">Go to Login</Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-loading">
          <div className="profile-loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Back Button */}
        <Link to="/" className="profile-back-btn">
          <Icon icon={arrowLeftIcon} width="20" height="20" />
          Back to Home
        </Link>

        {/* Profile Header */}
        <div className="profile-header">
          <div className="profile-avatar-section">
            <div className="profile-avatar">
              {studentData?.photo ? (
                <img src={studentData.photo} alt={currentUser.fullName} />
              ) : (
                <div className="profile-avatar-placeholder">
                  {currentUser.fullName?.split(' ').map(n => n[0]).join('')}
                </div>
              )}
              <div className={`profile-status-dot ${studentData?.status || 'offline'}`}></div>
            </div>
            <div className="profile-header-info">
              <h1>{currentUser.fullName}</h1>
              <p className="profile-username">@{currentUser.username}</p>
              <div className="profile-badges">
                <span className={`profile-badge ${currentUser.isAdmin ? 'admin' : 'student'}`}>
                  <Icon icon={currentUser.isAdmin ? shieldIcon : accountIcon} width="16" height="16" />
                  {currentUser.isAdmin ? 'Administrator' : studentData?.role || 'Student'}
                </span>
                <span className={`profile-badge ${studentData?.status === 'online' ? 'online' : 'offline'}`}>
                  <Icon icon={studentData?.status === 'online' ? checkCircleIcon : circleOutlineIcon} width="16" height="16" />
                  {studentData?.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`profile-message profile-message-${messageType}`}>
            {message}
          </div>
        )}

        {/* Profile Navigation */}
        <div className="profile-nav">
          <button className={`profile-nav-btn ${activeSection === 'info' ? 'active' : ''}`} onClick={() => setActiveSection('info')}>
            <Icon icon={accountIcon} width="20" height="20" />Info
          </button>
          <button className={`profile-nav-btn ${activeSection === 'activity' ? 'active' : ''}`} onClick={() => setActiveSection('activity')}>
            <Icon icon={starIcon} width="20" height="20" />Activity
          </button>
          <button className={`profile-nav-btn ${activeSection === 'security' ? 'active' : ''}`} onClick={() => setActiveSection('security')}>
            <Icon icon={lockIcon} width="20" height="20" />Security
          </button>
        </div>

        {/* Profile Content */}
        <div className="profile-content">
          {/* Info Section */}
          {activeSection === 'info' && (
            <div className="profile-section">
              {editing ? (
                <form onSubmit={handleSaveProfile} className="profile-edit-form">
                  <h3>Edit Profile</h3>
                  <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" value={editForm.full_name} onChange={e => setEditForm({...editForm, full_name: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Email</label>
                    <input type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label>Bio</label>
                    <textarea value={editForm.bio} onChange={e => setEditForm({...editForm, bio: e.target.value})} rows="4" />
                  </div>
                  <div className="form-actions">
                    <button type="submit" className="profile-save-btn">Save Changes</button>
                    <button type="button" className="profile-cancel-btn" onClick={() => setEditing(false)}>Cancel</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="profile-info-header">
                    <h3>Personal Information</h3>
                    <button className="profile-edit-btn" onClick={startEditing}>
                      <Icon icon={pencilIcon} width="16" height="16" />Edit
                    </button>
                  </div>
                  <div className="profile-info-grid">
                    <div className="profile-info-item">
                      <span className="info-label"><Icon icon={accountIcon} width="18" height="18" />Full Name</span>
                      <span className="info-value">{currentUser.fullName}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label"><Icon icon={accountIcon} width="18" height="18" />Username</span>
                      <span className="info-value">@{currentUser.username}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label"><Icon icon={emailIcon} width="18" height="18" />Email</span>
                      <span className="info-value">{studentData?.email || 'Not set'}</span>
                    </div>
                    <div className="profile-info-item">
                      <span className="info-label"><Icon icon={shieldIcon} width="18" height="18" />Role</span>
                      <span className="info-value">{currentUser.isAdmin ? 'Administrator' : studentData?.role || 'Student'}</span>
                    </div>
                  </div>
                  {studentData?.bio && (
                    <div className="profile-bio">
                      <h4>About</h4>
                      <p>{studentData.bio}</p>
                    </div>
                  )}
                  {studentData?.skills && studentData.skills.length > 0 && (
                    <div className="profile-skills">
                      <h4>Skills</h4>
                      <div className="skills-list">
                        {studentData.skills.map((skill, i) => (
                          <span key={i} className="skill-tag">{skill}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Activity Section */}
          {activeSection === 'activity' && (
            <div className="profile-section">
              <h3><Icon icon={chatIcon} width="20" height="20" />Recent Activity</h3>
              <div className="profile-activity">
                <div className="activity-item">
                  <Icon icon={checkCircleIcon} width="20" height="20" />
                  <div>
                    <p>Account created</p>
                    <span>Member since joining</span>
                  </div>
                </div>
                <div className="activity-item">
                  <Icon icon={starIcon} width="20" height="20" />
                  <div>
                    <p>Profile views</p>
                    <span>Your profile has been viewed by classmates</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Section */}
          {activeSection === 'security' && (
            <div className="profile-section">
              <h3><Icon icon={lockIcon} width="20" height="20" />Security</h3>
              <div className="security-options">
                <Link to="/forgot-password" className="security-item">
                  <Icon icon={keyIcon} width="24" height="24" />
                  <div>
                    <h4>Change Password</h4>
                    <p>Reset your password using the forgot password page</p>
                  </div>
                  <Icon icon={arrowLeftIcon} width="20" height="20" style={{ transform: 'rotate(180deg)' }} />
                </Link>
                <div className="security-item">
                  <Icon icon={shieldIcon} width="24" height="24" />
                  <div>
                    <h4>Account Status</h4>
                    <p>Your account is active and verified</p>
                  </div>
                  <Icon icon={checkCircleIcon} width="20" height="20" style={{ color: '#10b981' }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;