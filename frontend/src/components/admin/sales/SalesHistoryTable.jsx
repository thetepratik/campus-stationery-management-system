import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiEye, FiDownload } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';
import { saleApi } from '../../../services/saleApi';

const SalesHistoryTable = ({ sales = [], onView, onUndo }) => {
  const [downloadingId, setDownloadingId] = useState(null);

  if (!sales.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>No sales found</div>;
  }

  const handleDownloadInvoice = async (s) => {
    setDownloadingId(s._id);
    try {
      await saleApi.downloadInvoice(s._id, s.saleId);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Unable to generate invoice. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

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
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s._id} style={s.status === 'reversed' ? { opacity: 0.75 } : {}}>
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
                {s.status === 'reversed' ? (
                  <span className="badge badge--cancelled">Reversed</span>
                ) : (
                  <span className="badge badge--completed">Completed</span>
                )}
              </td>
              <td>
                <div className="flex items-center gap-2">
                  <button className="btn btn--ghost btn--sm btn--icon" onClick={() => onView(s)} title="View receipt">
                    <FiEye size={14} />
                  </button>
                  <button
                    className="btn btn--ghost btn--sm btn--icon"
                    onClick={() => handleDownloadInvoice(s)}
                    disabled={downloadingId === s._id}
                    title="Download invoice"
                  >
                    <FiDownload size={14} />
                  </button>
                  {s.status !== 'reversed' ? (
                    <button
                      className="btn btn--outline btn--sm"
                      style={{
                        color: 'var(--color-danger)',
                        borderColor: 'var(--color-danger)',
                        fontSize: 'var(--font-size-xs)',
                        padding: '3px 8px',
                        whiteSpace: 'nowrap',
                      }}
                      onClick={() => onUndo(s)}
                      title="Undo this sale"
                    >
                      ↩ Undo Sale
                    </button>
                  ) : (
                    <span
                      style={{
                        color: 'var(--color-text-muted)',
                        fontSize: 'var(--font-size-xs)',
                        fontStyle: 'italic',
                        padding: '3px 4px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      Reversed
                    </span>
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

export default SalesHistoryTable;
