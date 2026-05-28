import React, { useState, useEffect, useRef } from 'react';
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

const Navbar = ({ isDarkTheme, toggleTheme, currentUser, setCurrentUser }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const mobileMenuRef = useRef(null);

  // Handle responsive resize
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Close mobile menu when switching to desktop
      if (!mobile && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen && isMobile) {
      document.body.style.overflow = '';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    };
  }, [mobileMenuOpen, isMobile]);

  // Close menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Handle escape key to close menu
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/api/logout`, {
        method: 'POST',
        credentials: 'include',
      });
      setCurrentUser(null);
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const navLinks = [
    { path: '/', icon: homeIcon, label: 'Home' },
    { path: '/about', icon: informationIcon, label: 'About' },
    { path: '/gallery', icon: imageIcon, label: 'Gallery' },
    { path: '/chat', icon: chatIcon, label: 'Chat' },
  ];

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="nav-container">
        {/* Logo */}
        <Link
          to="/"
          className="nav-logo"
          onClick={closeMobileMenu}
          aria-label="L3SOD Portfolio Home"
        >
          <span className="logo-text">L3SOD</span>
          <span className="logo-subtext">Portfolio</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="nav-links" role="menubar">
          {navLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`nav-link ${
                location.pathname === link.path ? 'active' : ''
              }`}
              role="menuitem"
              aria-current={location.pathname === link.path ? 'page' : undefined}
            >
              <Icon icon={link.icon} width="20" height="20" aria-hidden="true" />
              <span>{link.label}</span>
            </Link>
          ))}
          {currentUser?.isAdmin && (
            <Link
              to="/admin"
              className={`nav-link admin-link ${
                location.pathname === '/admin' ? 'active' : ''
              }`}
              role="menuitem"
              aria-current={location.pathname === '/admin' ? 'page' : undefined}
            >
              <Icon icon={shieldIcon} width="20" height="20" aria-hidden="true" />
              <span>Admin</span>
            </Link>
          )}
        </div>

        {/* Desktop Actions */}
        <div className="nav-actions">
          <button
            onClick={toggleTheme}
            className="theme-btn"
            title={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label={isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <Icon
              icon={isDarkTheme ? whiteBalanceSunny : moonWaningCrescent}
              width="22"
              height="22"
              aria-hidden="true"
            />
          </button>

          {currentUser ? (
            <div className="user-menu" role="group" aria-label="User menu">
              <Icon icon={accountIcon} width="20" height="20" aria-hidden="true" />
              <span title={currentUser.username || currentUser.name}>
                {currentUser.username || currentUser.name}
              </span>
              <button
                onClick={handleLogout}
                className="logout-icon-btn"
                title="Logout"
                aria-label="Logout"
              >
                <Icon icon={logoutIcon} width="18" height="18" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="login-btn-nav"
              aria-label="Login to your account"
            >
              <Icon icon={loginIcon} width="20" height="20" aria-hidden="true" />
              <span>Login</span>
            </Link>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="mobile-menu-btn"
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
        >
          <Icon
            icon={mobileMenuOpen ? closeIcon : menuIcon}
            width="26"
            height="26"
            aria-hidden="true"
          />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobile && mobileMenuOpen && (
        <div
          className={`mobile-overlay ${mobileMenuOpen ? 'show' : ''}`}
          onClick={closeMobileMenu}
          aria-hidden="true"
        />
      )}

      {/* Mobile Menu Panel */}
      {isMobile && (
        <div
          id="mobile-menu"
          ref={mobileMenuRef}
          className={`mobile-menu ${mobileMenuOpen ? 'open' : ''}`}
          role="dialog"
          aria-modal="true"
          aria-label="Mobile navigation menu"
        >
          {/* Mobile Menu Header */}
          <div className="mobile-menu-header">
            <div className="mobile-menu-title">
              <span className="logo-text" style={{ fontSize: '1.4rem' }}>
                L3SOD
              </span>
            </div>
            <button
              className="mobile-menu-close"
              onClick={closeMobileMenu}
              aria-label="Close menu"
            >
              <Icon icon={closeIcon} width="26" height="26" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="mobile-nav-links" role="navigation">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`mobile-nav-link ${
                  location.pathname === link.path ? 'active' : ''
                }`}
                onClick={closeMobileMenu}
                aria-current={
                  location.pathname === link.path ? 'page' : undefined
                }
              >
                <Icon
                  icon={link.icon}
                  width="24"
                  height="24"
                  aria-hidden="true"
                />
                <span>{link.label}</span>
                {location.pathname === link.path && (
                  <span className="active-dot" aria-hidden="true"></span>
                )}
              </Link>
            ))}
            {currentUser?.isAdmin && (
              <Link
                to="/admin"
                className={`mobile-nav-link admin ${
                  location.pathname === '/admin' ? 'active' : ''
                }`}
                onClick={closeMobileMenu}
                aria-current={
                  location.pathname === '/admin' ? 'page' : undefined
                }
              >
                <Icon
                  icon={shieldIcon}
                  width="24"
                  height="24"
                  aria-hidden="true"
                />
                <span>Admin Panel</span>
                {location.pathname === '/admin' && (
                  <span className="active-dot" aria-hidden="true"></span>
                )}
              </Link>
            )}
          </nav>

          <div className="mobile-menu-divider" aria-hidden="true"></div>

          {/* Actions Section */}
          <div className="mobile-actions">
            {/* Theme Toggle */}
            <button
              onClick={() => {
                toggleTheme();
                // Don't close menu on theme toggle
              }}
              className="mobile-action-btn theme-action"
              aria-label={
                isDarkTheme ? 'Switch to Light Mode' : 'Switch to Dark Mode'
              }
            >
              <Icon
                icon={isDarkTheme ? whiteBalanceSunny : moonWaningCrescent}
                width="24"
                height="24"
                aria-hidden="true"
              />
              <span>{isDarkTheme ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* User Info / Login */}
            {currentUser ? (
              <>
                <div
                  className="mobile-user-info"
                  role="group"
                  aria-label="User information"
                >
                  <Icon
                    icon={accountIcon}
                    width="42"
                    height="42"
                    aria-hidden="true"
                  />
                  <div>
                    <span className="mobile-user-name">
                      {currentUser.username || currentUser.name}
                    </span>
                    <span className="mobile-user-role">
                      {currentUser.isAdmin ? 'Administrator' : 'Student'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="mobile-action-btn logout-action"
                  aria-label="Logout from your account"
                >
                  <Icon
                    icon={logoutIcon}
                    width="24"
                    height="24"
                    aria-hidden="true"
                  />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="mobile-action-btn login-action"
                onClick={closeMobileMenu}
                aria-label="Login to your account"
              >
                <Icon
                  icon={loginIcon}
                  width="24"
                  height="24"
                  aria-hidden="true"
                />
                <span>Login to Your Account</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;