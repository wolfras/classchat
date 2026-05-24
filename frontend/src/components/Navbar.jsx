import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react';
import homeIcon from '@iconify/icons-mdi/home';
import informationIcon from '@iconify/icons-mdi/information';
import imageIcon from '@iconify/icons-mdi/image';
import chatIcon from '@iconify/icons-mdi/chat';
import shieldIcon from '@iconify/icons-mdi/shield';
import whiteBalanceSunny from '@iconify/icons-mdi/white-balance-sunny';
import moonWaningCrescent from '@iconify/icons-mdi/moon-waning-crescent';
import accountIcon from '@iconify/icons-mdi/account';
import logoutIcon from '@iconify/icons-mdi/logout';
import loginIcon from '@iconify/icons-mdi/login';
import { API_URL } from '../config';
import './Navbar.css';

const Navbar = ({ isDarkTheme, toggleTheme, currentUser, setCurrentUser, onChatOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/logout`, { 
      method: 'POST',
      credentials: 'include'
    });
    setCurrentUser(null);
    navigate('/');
  };

  const navLinks = [
    { path: '/chat', icon: chatIcon, label: 'Chat' },
    { path: '/', icon: homeIcon, label: 'Home' },
    { path: '/about', icon: informationIcon, label: 'About' },
    { path: '/gallery', icon: imageIcon, label: 'Gallery' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          <span className="logo-text">L3SOD</span>
          <span className="logo-subtext">Portfolio</span>
        </Link>

        <div className="nav-links">
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
            >
              <Icon icon={link.icon} width="20" height="20" />
              <span>{link.label}</span>
            </Link>
          ))}
          {currentUser?.isAdmin && (
            <Link
              to="/admin"
              className={`nav-link admin-link ${location.pathname === '/admin' ? 'active' : ''}`}
            >
              <Icon icon={shieldIcon} width="20" height="20" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        <div className="nav-actions">

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="theme-btn" title="Toggle Theme">
            <Icon 
              icon={isDarkTheme ? whiteBalanceSunny : moonWaningCrescent} 
              width="22" height="22" 
            />
          </button>

          {currentUser ? (
            /* User is logged in */
            <div className="user-menu">
              <Icon icon={accountIcon} width="20" height="20" />
              <span>{currentUser.username || currentUser.name}</span>
              <button onClick={handleLogout} className="logout-icon-btn" title="Logout">
                <Icon icon={logoutIcon} width="18" height="18" />
              </button>
            </div>
          ) : (
            /* User is NOT logged in - Show Login button that redirects to login page */
            <Link to="/login" className="login-btn-nav">
              <Icon icon={loginIcon} width="20" height="20" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;