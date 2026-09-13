const NotificationTabs = ({
  activeTab = 'all',
  onTabChange,
  categoryCounts = {},
  role = 'admin',
}) => {
  const adminTabs = [
    { id: 'all', label: 'All' },
    { id: 'orders', label: 'Orders' },
    { id: 'payments', label: 'Payments' },
    { id: 'inventory', label: 'Inventory' },
    { id: 'system', label: 'System' },
  ];

  const studentTabs = [
    { id: 'all', label: 'All' },
    { id: 'orders', label: 'Orders' },
  ];

  // Only add offers tab if offers count > 0
  if (categoryCounts.offers && categoryCounts.offers > 0) {
    studentTabs.push({ id: 'offers', label: 'Offers' });
  }

  const tabs = role === 'admin' ? adminTabs : studentTabs;

  return (
    <div className="notification-tabs">
      {tabs.map((tab) => {
        const count = categoryCounts[tab.id] ?? 0;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            className={`notification-tab ${isActive ? 'notification-tab--active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            <span>{tab.label}</span>
            {count > 0 && <span className="notification-tab__badge">{count}</span>}
          </button>
        );
      })}
    </div>
  );
};

export default NotificationTabs;
