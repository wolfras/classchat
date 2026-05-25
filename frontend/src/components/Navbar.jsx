import React, { useState } from 'react';
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
import menuIcon from '@iconify/icons-mdi/menu';
import closeIcon from '@iconify/icons-mdi/close';
import { API_URL } from '../config';
import './Navbar.css';

const Navbar = ({ isDarkTheme, toggleTheme, currentUser, setCurrentUser, onChatOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch(`${API_URL}/api/logout`, { 
      method: 'POST',
      credentials: 'include'
    });
    setCurrentUser(null);
    navigate('/');
    setMobileMenuOpen(false);
  };

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const navLinks = [
    { path: '/chat', icon: chatIcon, label: 'Chat' },
    { path: '/', icon: homeIcon, label: 'Home' },
    { path: '/about', icon: informationIcon, label: 'About' },
    { path: '/gallery', icon: imageIcon, label: 'Gallery' },
  ];

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo" onClick={closeMobileMenu}>
          <span className="logo-text">L3SOD</span>
          <span className="logo-subtext">Portfolio</span>
        </Link>

        <button 
          className="mobile-menu-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          <Icon icon={mobileMenuOpen ? closeIcon : menuIcon} width="24" height="24" />
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          {navLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <Icon icon={link.icon} width="20" height="20" />
              <span>{link.label}</span>
            </Link>
          ))}
          {currentUser?.isAdmin && (
            <Link
              to="/admin"
              className={`nav-link admin-link ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={closeMobileMenu}
            >
              <Icon icon={shieldIcon} width="20" height="20" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        <div className="nav-actions">
          <button onClick={toggleTheme} className="theme-btn" title="Toggle Theme">
            <Icon 
              icon={isDarkTheme ? whiteBalanceSunny : moonWaningCrescent} 
              width="22" height="22" 
            />
          </button>

          {currentUser ? (
            <div className="user-menu">
              <Icon icon={accountIcon} width="20" height="20" />
              <span>{currentUser.username || currentUser.name}</span>
              <button onClick={handleLogout} className="logout-icon-btn" title="Logout">
                <Icon icon={logoutIcon} width="18" height="18" />
              </button>
            </div>
          ) : (
            <Link to="/login" className="login-btn-nav" onClick={closeMobileMenu}>
              <Icon icon={loginIcon} width="20" height="20" />
              <span>Login</span>
            </Link>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}
    </nav>
  );
};

export default Navbar;