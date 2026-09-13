import { FiShoppingBag, FiCreditCard, FiAlertTriangle, FiInfo } from 'react-icons/fi';
import { formatRelativeTime } from '../../../utils/formatDate';

const ICON_MAP = {
  order: { icon: FiShoppingBag, color: 'primary' },
  payment: { icon: FiCreditCard, color: 'secondary' },
  stock: { icon: FiAlertTriangle, color: 'warning' },
  system: { icon: FiInfo, color: 'info' },
};

const RecentNotifications = ({ notifications = [] }) => {
  if (!notifications.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>No notifications yet</div>;
  }

  return (
    <div>
      {notifications.map((n) => {
        const { icon: Icon, color } = ICON_MAP[n.type] || ICON_MAP.system;
        return (
          <div className="mini-list-item" key={n._id} style={{ alignItems: 'flex-start' }}>
            <div className="flex items-center gap-2" style={{ alignItems: 'flex-start' }}>
              <div
                style={{
                  width: 28, height: 28, borderRadius: 'var(--radius-sm)',
                  background: `var(--color-${color}-light)`, color: `var(--color-${color})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
                }}
              >
                <Icon size={13} />
              </div>
              <div>
                <div className="mini-list-item__name">{n.title}</div>
                <div className="mini-list-item__meta">{n.message}</div>
              </div>
            </div>
            <span className="mini-list-item__meta" style={{ whiteSpace: 'nowrap' }}>{formatRelativeTime(n.createdAt)}</span>
          </div>
        );
      })}
    </div>
  );
};

export default RecentNotifications;
