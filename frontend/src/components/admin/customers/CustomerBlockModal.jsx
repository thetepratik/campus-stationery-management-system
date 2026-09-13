import { useState } from 'react';
import { FiAlertTriangle, FiCheckCircle, FiX } from 'react-icons/fi';

const CustomerBlockModal = ({
  open,
  customer,
  action = 'block', // 'block' or 'unblock'
  onClose,
  onConfirm,
  loading = false,
}) => {
  const [reason, setReason] = useState('');

  if (!open || !customer) return null;

  const isBlock = action === 'block';

  const handleConfirm = () => {
    onConfirm(customer, isBlock ? 'blocked' : 'active', reason);
    setReason('');
  };

  return (
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
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 440,
          padding: 'var(--space-6)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-xl)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 'var(--space-4)' }}
        >
          <div className="flex items-center gap-2">
            {isBlock ? (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'var(--color-danger-light, rgba(239, 68, 68, 0.12))',
                  color: 'var(--color-danger)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiAlertTriangle size={18} />
              </div>
            ) : (
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: 'rgba(16, 185, 129, 0.12)',
                  color: '#10B981',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <FiCheckCircle size={18} />
              </div>
            )}
            <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>
              {isBlock ? 'Block Customer' : 'Unblock Customer'}
            </h3>
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--icon btn--sm"
            onClick={onClose}
            aria-label="Close"
          >
            <FiX size={18} />
          </button>
        </div>

        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
            marginBottom: 'var(--space-4)',
            lineHeight: 1.5,
          }}
        >
          {isBlock ? (
            <>
              Are you sure you want to block <strong>{customer.name}</strong> (Roll No:{' '}
              <code>{customer.rollNumber}</code>)? They will be temporarily restricted from
              placing orders and accessing their account.
            </>
          ) : (
            <>
              Are you sure you want to unblock <strong>{customer.name}</strong> (Roll No:{' '}
              <code>{customer.rollNumber}</code>)? Their account will be restored to active
              standing.
            </>
          )}
        </p>

        {isBlock && (
          <div style={{ marginBottom: 'var(--space-5)' }}>
            <label
              htmlFor="block-reason-input"
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 6,
              }}
            >
              Reason (Optional notification to student):
            </label>
            <textarea
              id="block-reason-input"
              className="form-input"
              rows={3}
              placeholder="e.g. Uncollected orders, policy violation..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              style={{ width: '100%', resize: 'vertical' }}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            id="confirm-block-btn"
            className={`btn btn--sm ${isBlock ? 'btn--danger' : 'btn--primary'}`}
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading
              ? 'Processing...'
              : isBlock
              ? 'Block Customer'
              : 'Unblock Customer'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerBlockModal;
