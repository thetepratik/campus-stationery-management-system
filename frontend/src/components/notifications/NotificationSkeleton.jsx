import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

const NotificationSkeleton = ({ count = 4 }) => {
  return (
    <div className="notification-skeleton-list">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="notification-card notification-card--skeleton">
          <div className="notification-card__icon-wrapper">
            <Skeleton circle width={40} height={40} />
          </div>
          <div className="notification-card__content" style={{ flex: 1 }}>
            <div className="flex items-center justify-between gap-2" style={{ marginBottom: 6 }}>
              <Skeleton width="45%" height={16} />
              <Skeleton width={60} height={12} />
            </div>
            <Skeleton count={1} width="85%" height={14} style={{ marginBottom: 8 }} />
            <div className="flex items-center gap-2">
              <Skeleton width={80} height={26} borderRadius={6} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationSkeleton;
