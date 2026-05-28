import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { io } from 'socket.io-client';
import { Icon } from '@iconify/react';
import arrowRightIcon from '@iconify/icons-mdi/arrow-right';
import accountGroupIcon from '@iconify/icons-mdi/account-group';
import codeBracesIcon from '@iconify/icons-mdi/code-braces';
import rocketIcon from '@iconify/icons-mdi/rocket';
import chatIcon from '@iconify/icons-mdi/chat';
import circleIcon from '@iconify/icons-mdi/circle';
import { API_URL } from '../config';
import { SOCKET_URL } from '../config';
import './Home.css';

const Home = ({ isDarkTheme }) => {
  const [stats, setStats] = useState({
    students: 76,
    online: 0,
    messages: 0,
    projects: 12
  });
  const [onlineUsers, setOnlineUsers] = useState([]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);

    // Fetch initial data
    fetch(`${API_URL}/api/students`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          const online = data.students.filter(s => s.status === 'online').length;
          setStats(prev => ({ ...prev, online, students: data.students.length }));
          setOnlineUsers(data.students.filter(s => s.status === 'online'));
        }
      })
      .catch(err => console.error('Error fetching stats:', err));

    // Real-time updates
    newSocket.on('students_updated', (students) => {
      const online = students.filter(s => s.status === 'online').length;
      setStats(prev => ({ ...prev, online, students: students.length }));
      setOnlineUsers(students.filter(s => s.status === 'online'));
    });

    // Fetch messages count
    fetch(`${API_URL}/api/messages`)
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStats(prev => ({ ...prev, messages: data.messages?.length || 0 }));
        }
      })
      .catch(() => {});

    return () => newSocket.disconnect();
  }, []);

  return (
    <div className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <Icon icon={rocketIcon} width="20" height="20" />
            <span>Level 3 Software Development</span>
          </div>
          <h1 className="hero-title">
            Welcome to <span className="highlight">L3SOD</span> Class
          </h1>
          <p className="hero-subtitle">
            Where Innovation Meets Code - Building the Future Together
          </p>
          <p className="hero-description">
            We are a dynamic class of <strong>{stats.students}</strong> talented software developers, 
            designers, and tech enthusiasts. Explore our portfolio, view our gallery, 
            and connect with us through our real-time chat.
          </p>
          <div className="hero-buttons">
            <Link to="/about" className="btn-primary">
              <span>Learn More</span>
              <Icon icon={arrowRightIcon} width="20" height="20" />
            </Link>
            <Link to="/gallery" className="btn-secondary">
              <Icon icon={accountGroupIcon} width="20" height="20" />
              <span>View Students</span>
            </Link>
          </div>
        </div>

        <div className="hero-visual">
          <div className="floating-card card-1">
            <Icon icon={codeBracesIcon} width="32" height="32" />
            <span>Full Stack</span>
          </div>
          <div className="floating-card card-2">
            <Icon icon={accountGroupIcon} width="32" height="32" />
            <span>{stats.students} Members</span>
          </div>
          <div className="floating-card card-3">
            <Icon icon={chatIcon} width="32" height="32" />
            <span>{stats.online} Online</span>
          </div>
          <div className="hero-circle"></div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">
              <Icon icon={accountGroupIcon} width="32" height="32" />
            </div>
            <h3>{stats.students}</h3>
            <p>Total Students</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon online">
              <Icon icon={circleIcon} width="32" height="32" />
            </div>
            <h3>{stats.online}</h3>
            <p>Online Now</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icon icon={codeBracesIcon} width="32" height="32" />
            </div>
            <h3>{stats.projects}+</h3>
            <p>Projects</p>
          </div>
          <div className="stat-card">
            <div className="stat-icon">
              <Icon icon={chatIcon} width="32" height="32" />
            </div>
            <h3>{stats.messages}</h3>
            <p>Messages</p>
          </div>
        </div>
      </section>

      {/* Online Users */}
      {onlineUsers.length > 0 && (
        <section className="online-section">
          <h3>
            <Icon icon={circleIcon} width="16" height="16" style={{ color: '#10b981' }} />
            Online Now ({onlineUsers.length})
          </h3>
          <div className="online-users-list">
            {onlineUsers.slice(0, 10).map((user, i) => (
              <div key={i} className="online-user-badge" title={user.full_name}>
                {user.photo ? (
                  <img src={user.photo} alt={user.full_name} />
                ) : (
                  <div className="online-avatar-placeholder">
                    {user.full_name?.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
                <span>{user.full_name?.split(' ')[0]}</span>
                <span className="online-dot"></span>
              </div>
            ))}
            {onlineUsers.length > 10 && (
              <span className="more-online">+{onlineUsers.length - 10} more</span>
            )}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>What We Offer</h2>
          <p>Everything you need to connect, learn, and grow together</p>
        </div>
        <div className="features-grid">
          <Link to="/gallery" className="feature-card">
            <div className="feature-icon">
              <Icon icon={accountGroupIcon} width="40" height="40" />
            </div>
            <h3>Student Profiles</h3>
            <p>Browse through detailed profiles of all {stats.students} class members.</p>
          </Link>
          <div className="feature-card">
            <div className="feature-icon">
              <Icon icon={codeBracesIcon} width="40" height="40" />
            </div>
            <h3>Project Gallery</h3>
            <p>Showcase your projects, code snippets, and creative work.</p>
          </div>
          <Link to="/chat" className="feature-card">
            <div className="feature-icon">
              <Icon icon={chatIcon} width="40" height="40" />
            </div>
            <h3>Real-time Chat</h3>
            <p>Connect instantly with classmates. Group & private messaging.</p>
          </Link>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Connect?</h2>
          <p>Join {stats.online} classmates online now</p>
          <div className="cta-buttons">
            <Link to="/chat" className="btn-primary">
              <Icon icon={chatIcon} width="20" height="20" />
              <span>Open Chat</span>
            </Link>
            <Link to="/gallery" className="btn-secondary">
              <Icon icon={accountGroupIcon} width="20" height="20" />
              <span>View Gallery</span> 
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;