import { FiUsers, FiUserCheck, FiUserPlus, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';

const CustomerStats = ({ summary = {} }) => {
  const {
    totalCustomers = 0,
    activeCustomers = 0,
    newThisMonth = 0,
    totalOrders = 0,
    totalSpent = 0,
  } = summary;

  const stats = [
    {
      label: 'Total Customers',
      value: Number(totalCustomers).toLocaleString('en-IN'),
      icon: FiUsers,
      color: '#4F46E5', // indigo
      bg: 'rgba(79, 70, 229, 0.12)',
    },
    {
      label: 'Active Customers',
      value: Number(activeCustomers).toLocaleString('en-IN'),
      icon: FiUserCheck,
      color: '#10B981', // emerald
      bg: 'rgba(16, 185, 129, 0.12)',
    },
    {
      label: 'New This Month',
      value: Number(newThisMonth).toLocaleString('en-IN'),
      icon: FiUserPlus,
      color: '#3B82F6', // blue
      bg: 'rgba(59, 130, 246, 0.12)',
    },
    {
      label: 'Total Orders',
      value: Number(totalOrders).toLocaleString('en-IN'),
      icon: FiShoppingBag,
      color: '#F59E0B', // amber
      bg: 'rgba(245, 158, 11, 0.12)',
    },
    {
      label: 'Total Customer Spending',
      value: formatCurrency(totalSpent),
      icon: FiDollarSign,
      color: '#8B5CF6', // purple
      bg: 'rgba(139, 92, 246, 0.12)',
    },
  ];

  return (
    <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
      {stats.map((item, idx) => {
        const Icon = item.icon;
        return (
          <div key={idx} className="card stat-card">
            <div
              className="stat-card__icon"
              style={{ background: item.bg, color: item.color }}
            >
              <Icon size={22} />
            </div>
            <div>
              <div className="stat-card__label">{item.label}</div>
              <div className="stat-card__value">{item.value}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CustomerStats;
