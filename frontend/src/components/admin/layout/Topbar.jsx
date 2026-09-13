import { useState, useRef, useEffect } from 'react';
import { FiMenu, FiSearch, FiSun, FiMoon, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import NotificationBell from '../../notifications/NotificationBell';

const Topbar = ({ onToggleSidebar, onToggleMobileSidebar }) => {
  const { admin, adminLogout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="admin-topbar">
      <div className="flex items-center gap-3">
        <button className="admin-topbar__icon-btn admin-topbar__menu-mobile" onClick={onToggleMobileSidebar} aria-label="Toggle menu">
          <FiMenu size={20} />
        </button>
        <button className="admin-topbar__icon-btn admin-topbar__menu-desktop" onClick={onToggleSidebar} aria-label="Collapse sidebar">
          <FiMenu size={20} />
        </button>
        <div className="admin-topbar__search">
          <FiSearch size={16} />
          <input type="text" placeholder="Search products, orders..." />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button className="admin-topbar__icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'light' ? <FiMoon size={18} /> : <FiSun size={18} />}
        </button>

        <NotificationBell role="admin" />

        <div className="admin-topbar__profile" ref={menuRef}>
          <button className="admin-topbar__profile-btn" onClick={() => setMenuOpen((v) => !v)}>
            <div className="admin-topbar__avatar">{admin?.name?.charAt(0)?.toUpperCase() || 'A'}</div>
            <span className="admin-topbar__profile-name">{admin?.name || 'Admin'}</span>
            <FiChevronDown size={14} />
          </button>
          {menuOpen && (
            <div className="admin-topbar__dropdown">
              <div className="admin-topbar__dropdown-item admin-topbar__dropdown-item--label">
                Signed in as <strong>{admin?.email}</strong>
              </div>
              <button className="admin-topbar__dropdown-item" onClick={adminLogout}>
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
