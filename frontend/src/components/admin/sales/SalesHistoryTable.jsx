import { FiEye, FiDownload } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';
import { saleApi } from '../../../services/saleApi';

const SalesHistoryTable = ({ sales = [], onView }) => {
  if (!sales.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>No sales found</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Sale ID</th>
            <th>Customer</th>
            <th>Items</th>
            <th>Amount</th>
            <th>Payment</th>
            <th>Date & Time</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s._id}>
              <td>{s.saleId}</td>
              <td>{s.customerName || 'Walk-in'}</td>
              <td>
                {s.items?.[0]?.name}
                {s.items?.length > 1 ? ` +${s.items.length - 1} more` : ''}
              </td>
              <td>{formatCurrency(s.totalAmount)}</td>
              <td style={{ textTransform: 'uppercase', fontSize: 'var(--font-size-xs)' }}>{s.paymentMethod}</td>
              <td>{formatDateTime(s.createdAt)}</td>
              <td>
                <div className="flex gap-2">
                  <button className="btn btn--ghost btn--sm btn--icon" onClick={() => onView(s)} title="View receipt">
                    <FiEye size={14} />
                  </button>
                  <button
                    className="btn btn--ghost btn--sm btn--icon"
                    onClick={() => window.open(saleApi.invoiceUrl(s._id), '_blank')}
                    title="Download invoice"
                  >
                    <FiDownload size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SalesHistoryTable;
