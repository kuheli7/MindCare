import { useState } from 'react';
import { FaBars, FaTimes } from 'react-icons/fa';
import './Navbar.css';

function Navbar({ currentPage, setCurrentPage, isUserAuthenticated, onUserLogout, currentUser, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const logoVersion = '20260222-1';

  const guestNavItems = [
    { id: 'home', label: 'Home' },
    { id: 'test-selection', label: 'Tests' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
    { id: 'login', label: 'Login' }
  ];

  const userNavItems = [
    { id: 'home', label: 'Home' },
    { id: 'test-selection', label: 'Tests' },
    { id: 'user-dashboard', label: 'Dashboard' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' }
  ];

  const userMenuItems = [
    { id: 'user-dashboard', label: 'Dashboard' },
    { id: 'user-analytics', label: 'Analytics' },
    { id: 'user-history', label: 'Test History' },
    { id: 'user-recommendations', label: 'Recommendations' }
  ];

  const navItems = isUserAuthenticated ? userNavItems : guestNavItems;

  const handleNavClick = (pageId) => {
    if (pageId === 'logout') {
      if (typeof onLogout === 'function') onLogout();
      setCurrentPage('home');
      setIsMenuOpen(false);
      return;
    }
    setCurrentPage(pageId);
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const getDisplayName = () => {
    if (!currentUser?.name) return 'team10';
    const first = currentUser.name.trim().split(' ')[0];
    return first.charAt(0).toUpperCase() + first.slice(1);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-logo">
          <img src={`/logo.png?v=${logoVersion}`} alt="MindCare Logo" className="logo-image" />
        </div>
        
        <button 
          className={`hamburger-menu ${isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
          {navItems.map(item => (
            <li key={item.id}>
              <button
                className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
                data-page={item.id}
                onClick={() => handleNavClick(item.id)}
              >
                {item.label}
              </button>
            </li>
          ))}

          {isUserAuthenticated && (
            <li className="user-menu-wrapper">
              <button
                className={`nav-link user-greeting ${isUserMenuOpen ? 'active' : ''}`}
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              >
                Hi {getDisplayName()}
              </button>

              {isUserMenuOpen && (
                <div className="user-popup-menu">
                  {userMenuItems.map((item) => (
                    <button
                      key={item.id}
                      className={`user-popup-item ${currentPage === item.id ? 'active' : ''}`}
                      onClick={() => handleNavClick(item.id)}
                    >
                      {item.label}
                    </button>
                  ))}
                  <button className="user-popup-item logout" onClick={onUserLogout}>
                    Logout
                  </button>
                </div>
              )}
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}

export default Navbar;
