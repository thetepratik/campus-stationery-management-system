import { useNavigate } from 'react-router-dom';
import {
  FiShoppingCart,
  FiCreditCard,
  FiPackage,
  FiAlertCircle,
  FiUser,
  FiSettings,
  FiCheckCircle,
  FiAlertTriangle,
  FiBell,
  FiTrash2,
  FiArrowRight,
} from 'react-icons/fi';
import { formatRelativeTime } from '../../utils/formatDate';
import { useNotifications } from '../../context/NotificationContext';

const getIconConfig = (type = '', category = '') => {
  const t = String(type).toUpperCase();
  const c = String(category).toLowerCase();

  if (t.includes('OUT_OF_STOCK')) {
    return { icon: FiAlertCircle, colorClass: 'danger' };
  }
  if (t.includes('LOW_STOCK') || t.includes('PAYMENT_FAIL')) {
    return { icon: FiAlertTriangle, colorClass: 'warning' };
  }
  if (t.includes('PAYMENT')) {
    return { icon: FiCreditCard, colorClass: 'secondary' };
  }
  if (t.includes('ORDER_READY') || t.includes('ORDER_COMPLETED')) {
    return { icon: FiCheckCircle, colorClass: 'success' };
  }
  if (c === 'orders' || t.includes('ORDER')) {
    return { icon: FiShoppingCart, colorClass: 'primary' };
  }
  if (c === 'inventory' || t.includes('STOCK') || t.includes('PRODUCT')) {
    return { icon: FiPackage, colorClass: 'info' };
  }
  if (t.includes('STUDENT') || t.includes('USER')) {
    return { icon: FiUser, colorClass: 'primary' };
  }
  if (c === 'offers') {
    return { icon: FiBell, colorClass: 'warning' };
  }
  return { icon: FiSettings, colorClass: 'info' };
};

const getActionButtonText = (type = '', category = '') => {
  const t = String(type).toUpperCase();
  if (t.includes('ORDER_PREPARING')) return 'Track Order';
  if (t.includes('ORDER') || category === 'orders') return 'View Order';
  if (t.includes('OUT_OF_STOCK')) return 'Restock Product';
  if (t.includes('LOW_STOCK') || category === 'inventory') return 'Manage Inventory';
  if (t.includes('STUDENT')) return 'View Customers';
  if (t.includes('PRODUCT')) return 'View Products';
  if (category === 'payments') return 'View Payments';
  return 'View Details';
};

const NotificationItem = ({ notification, onSelect, compact = false }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  const { _id, title, message, category, type, priority, actionUrl, link, isRead, createdAt } =
    notification;

  const url = actionUrl || link;
  const { icon: Icon, colorClass } = getIconConfig(type, category);
  const actionText = getActionButtonText(type, category);

  const handleClick = async (e) => {
    // If clicking delete button, don't navigate
    if (e.target.closest('.notification-card__delete-btn')) return;

    if (!isRead) {
      await markAsRead(_id);
    }
    if (onSelect) {
      onSelect(notification);
    }
    if (url) {
      navigate(url);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteNotification(_id);
  };

  if (compact) {
    return (
      <div
        className={`notification-mini-item ${!isRead ? 'notification-mini-item--unread' : ''}`}
        onClick={handleClick}
        role="button"
        tabIndex={0}
      >
        <div className={`notification-mini-item__icon notification-mini-item__icon--${colorClass}`}>
          <Icon size={14} />
        </div>
        <div className="notification-mini-item__body">
          <div className="notification-mini-item__title-row">
            <span className="notification-mini-item__title">{title}</span>
            <span className="notification-mini-item__time">{formatRelativeTime(createdAt)}</span>
          </div>
          <p className="notification-mini-item__msg">{message}</p>
        </div>
        {!isRead && <span className="notification-unread-dot" />}
      </div>
    );
  }

  return (
    <div
      className={`notification-card ${!isRead ? 'notification-card--unread' : ''} ${
        priority === 'critical' ? 'notification-card--critical' : ''
      }`}
      onClick={handleClick}
    >
      <div className={`notification-card__icon-box notification-card__icon-box--${colorClass}`}>
        <Icon size={20} />
      </div>

      <div className="notification-card__content">
        <div className="notification-card__header">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="notification-card__title">{title}</h4>
            {priority && priority !== 'normal' && (
              <span className={`notification-badge notification-badge--${priority}`}>
                {priority}
              </span>
            )}
            {!isRead && <span className="notification-badge notification-badge--new">New</span>}
          </div>
          <div className="flex items-center gap-2">
            <span className="notification-card__time">{formatRelativeTime(createdAt)}</span>
            <button
              className="notification-card__delete-btn"
              onClick={handleDelete}
              aria-label="Delete notification"
              title="Delete notification"
            >
              <FiTrash2 size={14} />
            </button>
          </div>
        </div>

        <p className="notification-card__message">{message}</p>

        {url && (
          <div className="notification-card__footer">
            <button
              className="notification-card__action-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleClick(e);
              }}
            >
              <span>{actionText}</span>
              <FiArrowRight size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationItem;
