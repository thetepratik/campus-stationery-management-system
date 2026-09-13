import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';

const STATUS_BADGE_MAP = {
  pending: 'pending',
  confirmed: 'confirmed',
  packing: 'confirmed',
  'ready-for-pickup': 'ready',
  collected: 'ready',
  completed: 'completed',
  cancelled: 'cancelled',
  refunded: 'cancelled',
};

const RecentOrdersTable = ({ orders = [] }) => {
  if (!orders.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>No orders yet</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Student</th>
            <th>Amount</th>
            <th>Status</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{o.orderId}</td>
              <td>{o.student?.name || '—'}</td>
              <td>{formatCurrency(o.totalAmount)}</td>
              <td>
                <span className={`badge badge--${STATUS_BADGE_MAP[o.status] || 'pending'}`}>{o.status}</span>
              </td>
              <td>{formatDateTime(o.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentOrdersTable;
