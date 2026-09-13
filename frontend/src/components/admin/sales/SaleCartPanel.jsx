import { FiMinus, FiPlus, FiTrash2, FiShoppingCart } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';

const SaleCartPanel = ({ cart, onIncrement, onDecrement, onRemove }) => {
  const totalAmount = cart.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);
  const totalItems = cart.reduce((sum, i) => sum + i.quantity, 0);

  if (!cart.length) {
    return (
      <div className="card panel">
        <div className="panel__header">
          <span className="panel__title">Current Sale</span>
        </div>
        <div className="empty-state" style={{ padding: 'var(--space-10) 0' }}>
          <FiShoppingCart size={28} color="var(--color-text-muted)" />
          <p>Search for a product on the left and add it to start a sale.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card panel">
      <div className="panel__header">
        <span className="panel__title">Current Sale</span>
        <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{totalItems} item(s)</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
        {cart.map((item) => (
          <div
            key={item._id}
            className="flex items-center justify-between"
            style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
          >
            <div>
              <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{item.name}</div>
              <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {formatCurrency(item.sellingPrice)} each
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <button className="btn btn--outline btn--sm btn--icon" onClick={() => onDecrement(item._id)}>
                  <FiMinus size={12} />
                </button>
                <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                <button
                  className="btn btn--outline btn--sm btn--icon"
                  onClick={() => onIncrement(item._id)}
                  disabled={item.quantity >= item.currentStock}
                  title={item.quantity >= item.currentStock ? 'No more stock available' : 'Add one more'}
                >
                  <FiPlus size={12} />
                </button>
              </div>
              <span style={{ fontWeight: 600, minWidth: 70, textAlign: 'right' }}>
                {formatCurrency(item.sellingPrice * item.quantity)}
              </span>
              <button className="btn btn--ghost btn--sm btn--icon" onClick={() => onRemove(item._id)} title="Remove">
                <FiTrash2 size={14} color="var(--color-danger)" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div
        className="flex justify-between items-center"
        style={{ paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}
      >
        <span style={{ fontSize: 'var(--font-size-base)', fontWeight: 600 }}>Total Amount</span>
        <span style={{ fontSize: 'var(--font-size-xl)', fontWeight: 700, color: 'var(--color-primary)' }}>
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
};

export default SaleCartPanel;
