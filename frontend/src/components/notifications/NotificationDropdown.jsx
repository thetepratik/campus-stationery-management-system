import { Link, useNavigate } from 'react-router-dom';
import { FiCheck, FiArrowRight, FiBell } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import NotificationItem from './NotificationItem';

const NotificationDropdown = ({ onClose, role = 'admin' }) => {
  const { notifications, unreadCount, markAllAsRead, loading } = useNotifications();
  const navigate = useNavigate();

  const viewAllUrl = role === 'admin' ? '/admin/notifications' : '/notifications';
  const latestNotifications = notifications.slice(0, 5);

  const handleViewAll = () => {
    onClose();
    navigate(viewAllUrl);
  };

  return (
    <div className="notification-dropdown">
      <div className="notification-dropdown__header">
        <div className="flex items-center gap-2">
          <span className="notification-dropdown__title">Notifications</span>
          {unreadCount > 0 && (
            <span className="notification-badge notification-badge--new">
              {unreadCount} new
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            className="notification-dropdown__action-link"
            onClick={markAllAsRead}
            title="Mark all as read"
          >
            <FiCheck size={13} />
            <span>Mark all read</span>
          </button>
        )}
      </div>

      <div className="notification-dropdown__body">
        {loading && !latestNotifications.length ? (
          <div className="notification-dropdown__empty">Loading notifications...</div>
        ) : !latestNotifications.length ? (
          <div className="notification-dropdown__empty">
            <FiBell size={20} style={{ opacity: 0.5, marginBottom: 4 }} />
            <span>No notifications yet</span>
          </div>
        ) : (
          latestNotifications.map((n) => (
            <NotificationItem
              key={n._id}
              notification={n}
              compact
              onSelect={onClose}
            />
          ))
        )}
      </div>

      <div className="notification-dropdown__footer">
        <button
          className="notification-dropdown__view-all-btn"
          onClick={handleViewAll}
        >
          <span>View All Notifications</span>
          <FiArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};

export default NotificationDropdown;
