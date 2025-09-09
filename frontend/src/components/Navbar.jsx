import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import NotificationBell from './NotificationBell';
import Tooltip from './Tooltip';
import { 
  RiLogoutBoxRLine, 
  RiUserLine, 
  RiHomeLine, 
  RiUploadLine, 
  RiGalleryLine, 
  RiMapPinLine,
  RiSettings3Line,
  RiFileListLine,
  RiMenuLine,
  RiCloseLine,
  RiFilePaper2Line,
  RiBugLine,
  RiFeedbackLine,
  RiDashboardLine,
  RiNotification3Line,
  RiNotification3Fill,
  RiQuestionLine,
  RiTrophyLine
} from 'react-icons/ri';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    try {
      logout();
      navigate('/');
    } catch (error) {
    } finally {
      setIsMobileMenuOpen(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Close mobile menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileMenuOpen && !event.target.closest('.navbar')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <nav className="navbar">
      <div className="navbar-container">
        {/* Logo */}
        <Link to="/" className="navbar-brand" onClick={closeMobileMenu}>
          <RiMapPinLine className="navbar-brand-icon" />
          <span className="navbar-brand-text">Indian Potholes</span>
        </Link>

        {/* Desktop Navigation - All items on the right */}
        <div className="navbar-nav-right desktop-nav">
          <Tooltip content="Go to homepage" placement="bottom">
            <Link to="/" className="navbar-link">
              <RiHomeLine className="nav-icon" />
              <span>Home</span>
            </Link>
          </Tooltip>
          <Tooltip content="Browse all pothole reports from the community" placement="bottom">
            <Link to="/gallery" className="navbar-link">
              <RiGalleryLine className="nav-icon" />
              <span>Gallery</span>
            </Link>
          </Tooltip>
          <Tooltip content="Report a new pothole with photos and location" placement="bottom">
            <Link to="/upload" className="btn btn-nav-primary">
              <RiUploadLine className="btn-icon" />
              <span>Report Pothole</span>
            </Link>
          </Tooltip>
          <Tooltip content="Get help and answers to frequently asked questions" placement="bottom">
            <Link to="/help-faq" className="navbar-link">
              <RiQuestionLine className="nav-icon" />
              <span>Help</span>
            </Link>
          </Tooltip>
          <Tooltip content="View MP/MLA Leaderboard" placement="bottom">
            <Link to="/leaderboard" className="navbar-link">
              <RiTrophyLine className="nav-icon" />
              <span>Leaderboard</span>
            </Link>
          </Tooltip>
          {isAuthenticated ? (
            <>
              <Tooltip content="View and manage your submitted reports" placement="bottom">
                <Link to="/my-reports" className="navbar-link">
                  <RiFileListLine className="nav-icon" />
                  <span>My Reports</span>
                </Link>
              </Tooltip>
              {user?.role === 'admin' && (
                <Tooltip content="Access admin dashboard and management tools" placement="bottom">
                  <Link to="/admin" className="navbar-link">
                    <RiDashboardLine className="nav-icon" />
                    <span>Admin</span>
                  </Link>
                </Tooltip>
              )}
              <NotificationBell />
              <Tooltip content="View and edit your profile settings" placement="bottom">
                <Link to="/profile" className="navbar-link user-profile-link">
                  <RiUserLine className="nav-icon" />
                  <span>{user?.name}</span>
                </Link>
              </Tooltip>
              <Tooltip content="Sign out of your account" placement="bottom">
                <button onClick={handleLogout} className="navbar-link logout-btn">
                  <RiLogoutBoxRLine className="nav-icon" />
                  <span>Logout</span>
                </button>
              </Tooltip>
            </>
          ) : (
            <>
              <Tooltip content="Sign in to your account" placement="bottom">
                <Link to="/login" className="navbar-link">Login</Link>
              </Tooltip>
              <Tooltip content="Create a new account to start reporting" placement="bottom">
                <Link to="/register" className="btn btn-nav-primary">Sign Up</Link>
              </Tooltip>
            </>
          )}
        </div>

        {/* Mobile menu button with notification ping */}
        <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
          {isMobileMenuOpen ? (
            <RiCloseLine className="mobile-menu-icon" />
          ) : (
            <div className="mobile-menu-icon-wrapper">
              <RiMenuLine className="mobile-menu-icon" />
              {isAuthenticated && unreadCount > 0 && (
                <span className="mobile-notification-ping">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          )}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      <div className={`mobile-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="mobile-nav-content">
          <Link to="/" className="mobile-nav-link" onClick={closeMobileMenu}>
            <RiHomeLine className="nav-icon" />
            <span>Home</span>
          </Link>
          <Link to="/gallery" className="mobile-nav-link" onClick={closeMobileMenu}>
            <RiGalleryLine className="nav-icon" />
            <span>Gallery</span>
          </Link>
          <Link to="/upload" className="mobile-nav-link" onClick={closeMobileMenu}>
            <RiUploadLine className="nav-icon" />
            <span>Report Pothole</span>
          </Link>
          <Link to="/help-faq" className="mobile-nav-link" onClick={closeMobileMenu}>
            <RiQuestionLine className="nav-icon" />
            <span>Help & FAQ</span>
          </Link>
          <Link to="/leaderboard" className="mobile-nav-link" onClick={closeMobileMenu}>
            <RiTrophyLine className="nav-icon" />
            <span>Leaderboard</span>
          </Link>
          {isAuthenticated ? (
            <>
              <Link to="/my-reports" className="mobile-nav-link" onClick={closeMobileMenu}>
                <RiFileListLine className="nav-icon" />
                <span>My Reports</span>
              </Link>
              {user?.role === 'admin' && (
                <Link to="/admin" className="mobile-nav-link" onClick={closeMobileMenu}>
                  <RiDashboardLine className="nav-icon" />
                  <span>Admin</span>
                </Link>
              )}
              <Link to="/notifications" className="mobile-nav-link mobile-notifications-link" onClick={closeMobileMenu}>
                <div className="mobile-nav-notification-wrapper">
                  {unreadCount > 0 ? (
                    <RiNotification3Fill className="nav-icon" />
                  ) : (
                    <RiNotification3Line className="nav-icon" />
                  )}
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="mobile-nav-notification-badge">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </Link>
              <Link to="/profile" className="mobile-nav-link" onClick={closeMobileMenu}>
                <RiUserLine className="nav-icon" />
                <span>{user?.name}</span>
              </Link>
              <button onClick={handleLogout} className="mobile-nav-link logout-btn">
                <RiLogoutBoxRLine className="nav-icon" />
                <span>Logout</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="mobile-nav-link" onClick={closeMobileMenu}>
                Login
              </Link>
              <Link to="/register" className="mobile-nav-link" onClick={closeMobileMenu}>
                Sign Up
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
