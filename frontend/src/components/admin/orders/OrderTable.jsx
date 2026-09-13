import { FiEye, FiTrash2 } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';
import { STATUS_BADGE_MAP, STATUS_LABELS } from '../../../utils/orderStatus';

const OrderTable = ({ orders = [], onView, onDelete }) => {
  if (!orders.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>No orders found</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Order ID</th>
            <th>Student</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Status</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o._id}>
              <td>{o.orderId}</td>
              <td>
                <div>{o.student?.name || '—'}</div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{o.student?.rollNumber}</div>
              </td>
              <td>{o.itemsCount}</td>
              <td>{formatCurrency(o.totalAmount)}</td>
              <td>
                <span
                  className={`badge ${
                    o.paymentStatus === 'paid' || o.status === 'completed' || o.status === 'collected'
                      ? 'badge--instock'
                      : o.paymentStatus === 'failed'
                      ? 'badge--outofstock'
                      : 'badge--pending'
                  }`}
                >
                  {o.paymentStatus === 'paid' || o.status === 'completed' || o.status === 'collected'
                    ? 'successful'
                    : o.paymentStatus}
                </span>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: 2 }}>
                  {o.paymentMethod === 'cash-on-pickup' ? 'cash' : o.paymentMethod}
                </div>
              </td>
              <td>
                <span className={`badge badge--${STATUS_BADGE_MAP[o.status] || 'pending'}`}>{STATUS_LABELS[o.status]}</span>
              </td>
              <td>{formatDateTime(o.createdAt)}</td>
              <td>
                <div className="flex gap-2">
                  <button className="btn btn--ghost btn--sm btn--icon" onClick={() => onView(o)} title="View order" aria-label="View order">
                    <FiEye size={14} />
                  </button>
                  {onDelete && (
                    <button
                      className="btn btn--ghost btn--sm btn--icon"
                      onClick={() => onDelete(o)}
                      title="Remove order"
                      aria-label="Remove order"
                    >
                      <FiTrash2 size={14} color="var(--color-danger)" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default OrderTable;
