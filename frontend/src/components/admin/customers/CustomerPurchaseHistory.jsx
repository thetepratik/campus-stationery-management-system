import { useState } from 'react';
import { FiEye, FiShoppingBag, FiTag, FiCalendar, FiCreditCard, FiX } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { formatDateTime } from '../../../utils/formatDate';

const CustomerPurchaseHistory = ({
  purchases = [],
  counts = {},
  activeType = 'all',
  onTypeChange,
  loading = false,
}) => {
  const [selectedPurchase, setSelectedPurchase] = useState(null);

  return (
    <div>
      {/* Tabs Row */}
      <div
        className="flex items-center justify-between"
        style={{
          flexWrap: 'wrap',
          gap: 'var(--space-3)',
          marginBottom: 'var(--space-4)',
          borderBottom: '1px solid var(--color-border)',
          paddingBottom: 'var(--space-3)',
        }}
      >
        <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn btn--sm ${activeType === 'all' ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => onTypeChange('all')}
          >
            All Purchases ({counts.totalPurchases || purchases.length || 0})
          </button>
          <button
            type="button"
            className={`btn btn--sm ${activeType === 'online' ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => onTypeChange('online')}
          >
            Online Orders ({counts.onlineCount || 0})
          </button>
          <button
            type="button"
            className={`btn btn--sm ${activeType === 'offline' ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => onTypeChange('offline')}
          >
            Offline Purchases ({counts.offlineCount || 0})
          </button>
        </div>
      </div>

      {/* Table */}
      {!purchases.length ? (
        <div
          className="empty-state"
          style={{
            padding: 'var(--space-8) 0',
            textAlign: 'center',
            color: 'var(--color-text-muted)',
          }}
        >
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-2)' }}>🛒</div>
          <div>No purchase records found for this customer under this filter.</div>
        </div>
      ) : (
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Products</th>
                <th>Qty</th>
                <th>Amount</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date & Time</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((p) => {
                const isOnline = p.type === 'online';
                const itemsSummary = (p.items || [])
                  .map((item) => `${item.name} (x${item.quantity})`)
                  .join(', ');

                const isPaid = p.paymentStatus === 'paid' || p.status === 'completed' || p.status === 'collected';
                const paymentBadgeClass = isPaid
                  ? 'badge--instock'
                  : p.paymentStatus === 'failed'
                  ? 'badge--outofstock'
                  : 'badge--pending';

                return (
                  <tr key={p.displayId || p.id}>
                    {/* ID */}
                    <td>
                      <span
                        style={{
                          fontWeight: 600,
                          fontFamily: 'monospace',
                          fontSize: 'var(--font-size-xs)',
                        }}
                      >
                        {p.displayId}
                      </span>
                    </td>

                    {/* Purchase Type */}
                    <td>
                      <span
                        className="badge"
                        style={{
                          background: isOnline
                            ? 'rgba(79, 70, 229, 0.12)'
                            : 'rgba(16, 185, 129, 0.12)',
                          color: isOnline ? '#4F46E5' : '#10B981',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {p.type}
                      </span>
                    </td>

                    {/* Products Description */}
                    <td style={{ maxWidth: 220 }}>
                      <div
                        style={{
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          fontSize: 'var(--font-size-xs)',
                        }}
                        title={itemsSummary}
                      >
                        {itemsSummary || '—'}
                      </div>
                    </td>

                    {/* Quantity */}
                    <td>
                      <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: 500 }}>
                        {p.itemsCount || 0}
                      </span>
                    </td>

                    {/* Total Amount */}
                    <td>
                      <strong style={{ fontSize: 'var(--font-size-sm)' }}>
                        {formatCurrency(p.totalAmount)}
                      </strong>
                    </td>

                    {/* Payment Method & Status */}
                    <td>
                      <span
                        className={`badge ${paymentBadgeClass}`}
                        style={{ textTransform: 'capitalize' }}
                      >
                        {isPaid ? 'successful' : p.paymentStatus}
                      </span>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          color: 'var(--color-text-muted)',
                          textTransform: 'uppercase',
                          marginTop: 2,
                        }}
                      >
                        {p.paymentMethod === 'cash-on-pickup' ? 'Cash' : p.paymentMethod}
                      </div>
                    </td>

                    {/* Order / Sale Status */}
                    <td>
                      <span
                        className="badge badge--pending"
                        style={{
                          textTransform: 'capitalize',
                          background:
                            p.status === 'completed' || p.status === 'collected'
                              ? 'rgba(16, 185, 129, 0.12)'
                              : p.status === 'cancelled'
                              ? 'rgba(239, 68, 68, 0.12)'
                              : 'rgba(245, 158, 11, 0.12)',
                          color:
                            p.status === 'completed' || p.status === 'collected'
                              ? '#10B981'
                              : p.status === 'cancelled'
                              ? '#EF4444'
                              : '#D97706',
                        }}
                      >
                        {p.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td>
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-secondary)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatDateTime(p.createdAt)}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ textAlign: 'right' }}>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm btn--icon"
                        onClick={() => setSelectedPurchase(p)}
                        title="View purchase details"
                        aria-label="View purchase details"
                      >
                        <FiEye size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Purchase Item Quick View Modal */}
      {selectedPurchase && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem',
          }}
          onClick={() => setSelectedPurchase(null)}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: 520,
              padding: 'var(--space-6)',
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-xl)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center justify-between"
              style={{
                marginBottom: 'var(--space-4)',
                borderBottom: '1px solid var(--color-border)',
                paddingBottom: 'var(--space-3)',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
                  {selectedPurchase.type === 'online' ? 'Online Order' : 'Offline Sale'}:{' '}
                  <span style={{ fontFamily: 'monospace' }}>{selectedPurchase.displayId}</span>
                </h3>
                <div
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-muted)',
                    marginTop: 2,
                  }}
                >
                  Recorded on {formatDateTime(selectedPurchase.createdAt)}
                </div>
              </div>
              <button
                type="button"
                className="btn btn--ghost btn--icon btn--sm"
                onClick={() => setSelectedPurchase(null)}
              >
                <FiX size={18} />
              </button>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: 'var(--space-4)' }}>
              <div
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  textTransform: 'uppercase',
                  marginBottom: 'var(--space-2)',
                }}
              >
                Items Purchased
              </div>
              <div
                style={{
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                }}
              >
                {(selectedPurchase.items || []).map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between"
                    style={{
                      padding: '8px 12px',
                      borderBottom:
                        idx < selectedPurchase.items.length - 1
                          ? '1px solid var(--color-border)'
                          : 'none',
                      fontSize: 'var(--font-size-sm)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        Qty: {item.quantity} × {formatCurrency(item.unitPrice)}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600 }}>{formatCurrency(item.subtotal)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Row */}
            <div
              className="flex items-center justify-between"
              style={{
                padding: '10px 12px',
                background: 'var(--color-bg)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-4)',
              }}
            >
              <div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Payment Method: <strong>{selectedPurchase.paymentMethod}</strong> (
                  {selectedPurchase.paymentStatus})
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Status: <strong>{selectedPurchase.status}</strong>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                  Total Amount
                </div>
                <div
                  style={{
                    fontSize: 'var(--font-size-lg)',
                    fontWeight: 700,
                    color: 'var(--color-primary)',
                  }}
                >
                  {formatCurrency(selectedPurchase.totalAmount)}
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                className="btn btn--outline btn--sm"
                onClick={() => setSelectedPurchase(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerPurchaseHistory;
