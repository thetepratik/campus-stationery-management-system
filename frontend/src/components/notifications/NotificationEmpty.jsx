import { FiBell } from 'react-icons/fi';

const NotificationEmpty = ({ category = 'all' }) => {
  const getMessage = () => {
    switch (category) {
      case 'orders':
        return 'No order notifications found.';
      case 'payments':
        return 'No payment notifications found.';
      case 'inventory':
        return 'No inventory notifications found.';
      case 'system':
        return 'No system notifications found.';
      case 'offers':
        return 'No offer notifications found.';
      default:
        return "You're all caught up!";
    }
  };

  return (
    <div className="notification-empty">
      <div className="notification-empty__icon-box">
        <FiBell size={28} />
      </div>
      <h3 className="notification-empty__title">No Notifications</h3>
      <p className="notification-empty__desc">{getMessage()}</p>
    </div>
  );
};

export default NotificationEmpty;
