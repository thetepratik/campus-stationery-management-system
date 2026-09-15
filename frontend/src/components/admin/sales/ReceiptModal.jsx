import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiPrinter, FiDownload, FiCheckCircle } from 'react-icons/fi';
import Modal from '../../common/Modal';
import Button from '../../common/Button';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';
import { saleApi } from '../../../services/saleApi';

const ReceiptModal = ({ open, onClose, sale }) => {
  const [downloading, setDownloading] = useState(false);

  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      await saleApi.downloadInvoice(sale._id, sale.saleId);
      toast.success('Invoice downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Unable to generate invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Sale Recorded" maxWidth={460}>
      <div id="receipt-print-area">
        {sale.status === 'reversed' ? (
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)', color: 'var(--color-danger)' }}>
            <span className="badge badge--cancelled" style={{ fontSize: '0.85rem' }}>Sale Reversed</span>
            {sale.reversedAt && (
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                on {formatDateTime(sale.reversedAt)}
              </span>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2" style={{ marginBottom: 'var(--space-4)', color: 'var(--color-secondary)' }}>
            <FiCheckCircle size={20} />
            <span style={{ fontWeight: 600 }}>Sale {sale.saleId} recorded successfully</span>
          </div>
        )}

        <div style={{ border: '1px dashed var(--color-border-strong)', borderRadius: 'var(--radius-md)', padding: 'var(--space-5)' }}>
          <div className="flex justify-between" style={{ marginBottom: 'var(--space-2)' }}>
            <strong>Campus Stationery</strong>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{sale.saleId}</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
            {formatDateTime(sale.createdAt)}
          </div>

          {(sale.customerName || sale.rollNumber || sale.department) && (
            <div style={{ fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-3)' }}>
              {sale.customerName && <div>{sale.customerName}</div>}
              {sale.rollNumber && <div style={{ color: 'var(--color-text-muted)' }}>{sale.rollNumber} · {sale.department}</div>}
            </div>
          )}

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 'var(--space-3)' }}>
            {sale.items.map((item, i) => (
              <div key={i} className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>
                <span>{item.name} × {item.quantity}</span>
                <span>{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
          </div>

          <div
            className="flex justify-between"
            style={{ borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', fontWeight: 700 }}
          >
            <span>Total</span>
            <span>{formatCurrency(sale.totalAmount)}</span>
          </div>
          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4, textTransform: 'uppercase' }}>
            Paid via {sale.paymentMethod}
          </div>
        </div>
      </div>

      <div className="flex gap-3 justify-end" style={{ marginTop: 'var(--space-5)' }}>
        <Button variant="outline" onClick={handleDownloadInvoice} loading={downloading}>
          <FiDownload size={14} /> Invoice PDF
        </Button>
        <Button variant="outline" onClick={handlePrint}>
          <FiPrinter size={14} /> Print Receipt
        </Button>
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
};

export default ReceiptModal;
