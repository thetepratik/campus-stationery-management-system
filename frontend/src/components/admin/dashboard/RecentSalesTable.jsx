import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';

const RecentSalesTable = ({ sales = [] }) => {
  if (!sales.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>No sales recorded yet</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s._id}>
              <td>{s.saleId}</td>
              <td>{s.items?.[0]?.name}{s.items?.length > 1 ? ` +${s.items.length - 1} more` : ''}</td>
              <td>{formatCurrency(s.totalAmount)}</td>
              <td style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)' }}>{s.paymentMethod}</td>
              <td>{formatDateTime(s.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RecentSalesTable;
