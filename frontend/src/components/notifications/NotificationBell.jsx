import { useState, useRef, useEffect } from 'react';
import { FiBell } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

const NotificationBell = ({ role = 'admin', className = '' }) => {
  const { unreadCount, fetchNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        // Refresh list when opening dropdown
        fetchNotifications({ limit: 5 });
      }
      return next;
    });
  };

  return (
    <div className={`notification-bell-container ${className}`} ref={containerRef}>
      <button
        type="button"
        className="admin-topbar__icon-btn notification-bell-btn"
        onClick={handleToggle}
        aria-label="Notifications"
        title="Notifications"
      >
        <FiBell size={18} />
        {unreadCount > 0 && (
          <span className="admin-topbar__bell-badge notification-bell-badge">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <NotificationDropdown
          role={role}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
