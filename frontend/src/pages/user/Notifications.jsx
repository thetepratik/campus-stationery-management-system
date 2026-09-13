import { useState, useEffect } from 'react';
import { FiCheck, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { useNotifications } from '../../context/NotificationContext';
import NotificationTabs from '../../components/notifications/NotificationTabs';
import NotificationItem from '../../components/notifications/NotificationItem';
import NotificationSkeleton from '../../components/notifications/NotificationSkeleton';
import NotificationEmpty from '../../components/notifications/NotificationEmpty';

const StudentNotifications = () => {
  const {
    notifications,
    unreadCount,
    categoryCounts,
    loading,
    error,
    pagination,
    fetchNotifications,
    markAllAsRead,
    clearAll,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchNotifications({
      category: activeTab,
      page: 1,
      limit: 20,
    });
  }, [activeTab, fetchNotifications]);

  const handlePageChange = (newPage) => {
    fetchNotifications({
      category: activeTab,
      page: newPage,
      limit: 20,
    });
  };

  const handleRefresh = () => {
    fetchNotifications({
      category: activeTab,
      page: pagination.page,
      limit: 20,
    });
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', paddingBottom: 'var(--space-12)' }}>
      {/* Header */}
      <div className="page-header flex items-center justify-between flex-wrap gap-4" style={{ marginBottom: 'var(--space-6)' }}>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="page-title" style={{ margin: 0, fontSize: '1.5rem' }}>Notifications</h1>
            {unreadCount > 0 && (
              <span className="notification-badge notification-badge--new">
                {unreadCount} unread
              </span>
            )}
          </div>
          <p className="page-subtitle" style={{ marginTop: 4, color: 'var(--color-text-secondary)' }}>
            Stay updated with your orders and stationery shop announcements.
          </p>
        </div>

        {/* Top-Right Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="btn btn--outline flex items-center gap-2"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh notifications"
          >
            <FiRefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>

          {unreadCount > 0 && (
            <button
              className="btn btn--primary flex items-center gap-2"
              onClick={markAllAsRead}
            >
              <FiCheck size={16} />
              <span>Mark all as read</span>
            </button>
          )}

          {notifications.length > 0 && (
            <button
              className="btn btn--ghost text-muted flex items-center gap-1"
              onClick={() => clearAll(false)}
              title="Clear read notifications"
            >
              <FiTrash2 size={14} />
              <span>Clear Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <NotificationTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
          categoryCounts={categoryCounts}
          role="student"
        />
      </div>

      {/* Content Area */}
      {error ? (
        <div className="notification-error-card">
          <p className="notification-error-text">Unable to load notifications.</p>
          <button className="btn btn--outline" onClick={handleRefresh}>
            Retry
          </button>
        </div>
      ) : loading && !notifications.length ? (
        <NotificationSkeleton count={4} />
      ) : !notifications.length ? (
        <NotificationEmpty category={activeTab} />
      ) : (
        <div className="notification-list">
          {notifications.map((notification) => (
            <NotificationItem
              key={notification._id}
              notification={notification}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="notification-pagination flex items-center justify-between" style={{ marginTop: 'var(--space-6)' }}>
          <span className="text-sm text-muted">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              className="btn btn--outline btn--sm"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              Previous
            </button>
            <button
              className="btn btn--outline btn--sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentNotifications;
