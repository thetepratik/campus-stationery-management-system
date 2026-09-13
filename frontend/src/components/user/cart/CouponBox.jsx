import { useState } from 'react';
import { FiTag, FiX } from 'react-icons/fi';
import Button from '../../common/Button';

const CouponBox = ({ couponCode, couponError, onApply, onRemove }) => {
  const [code, setCode] = useState('');
  const [applying, setApplying] = useState(false);

  const handleApply = async () => {
    if (!code.trim()) return;
    setApplying(true);
    const ok = await onApply(code.trim());
    setApplying(false);
    if (ok) setCode('');
  };

  if (couponCode) {
    return (
      <div
        className="flex items-center justify-between"
        style={{
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-md)',
          background: couponError ? 'var(--color-danger-light)' : 'var(--color-secondary-light)',
          marginBottom: 'var(--space-4)',
        }}
      >
        <div className="flex items-center gap-2">
          <FiTag size={14} color={couponError ? 'var(--color-danger)' : 'var(--color-secondary)'} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>{couponCode}</div>
            {couponError && <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>{couponError}</div>}
          </div>
        </div>
        <button className="btn btn--ghost btn--sm btn--icon" onClick={onRemove}>
          <FiX size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-2" style={{ marginBottom: 'var(--space-4)' }}>
      <input
        type="text"
        className="form-input"
        style={{ flex: 1, textTransform: 'uppercase' }}
        placeholder="Enter coupon code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleApply()}
      />
      <Button variant="outline" onClick={handleApply} loading={applying}>
        Apply
      </Button>
    </div>
  );
};

export default CouponBox;
