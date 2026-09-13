import { FiArrowUp, FiArrowDown } from 'react-icons/fi';
import { formatDateTime } from '../../../utils/formatDate';

const TYPE_LABELS = {
  restock: 'Restock',
  'sale-offline': 'Offline Sale',
  'sale-online': 'Online Sale',
  adjustment: 'Adjustment',
  return: 'Return',
};

const StockHistoryTable = ({ entries = [] }) => {
  if (!entries.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>No stock movements recorded yet</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Type</th>
            <th>Change</th>
            <th>Before → After</th>
            <th>Note</th>
            <th>By</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr key={e._id}>
              <td>{e.product?.name || 'Deleted product'}</td>
              <td>
                <span className={`badge ${e.quantityChange >= 0 ? 'badge--instock' : 'badge--lowstock'}`}>
                  {TYPE_LABELS[e.type] || e.type}
                </span>
              </td>
              <td>
                <span
                  className="flex items-center gap-1"
                  style={{ color: e.quantityChange >= 0 ? 'var(--color-secondary)' : 'var(--color-danger)', fontWeight: 600 }}
                >
                  {e.quantityChange >= 0 ? <FiArrowUp size={13} /> : <FiArrowDown size={13} />}
                  {Math.abs(e.quantityChange)}
                </span>
              </td>
              <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                {e.stockBefore} → {e.stockAfter}
              </td>
              <td style={{ maxWidth: 220, fontSize: 'var(--font-size-xs)' }}>{e.note || '—'}</td>
              <td>{e.performedBy?.name || 'System'}</td>
              <td>{formatDateTime(e.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StockHistoryTable;
