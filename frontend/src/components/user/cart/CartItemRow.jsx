import { Link } from 'react-router-dom';
import { FiMinus, FiPlus, FiTrash2, FiAlertTriangle } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';

const CartItemRow = ({ item, onIncrement, onDecrement, onRemove }) => (
  <div
    className="flex items-center gap-4"
    style={{ padding: 'var(--space-4) 0', borderBottom: '1px solid var(--color-border)' }}
  >
    <Link to={`/products/${item.product._id}`} style={{ flexShrink: 0 }}>
      {item.product.images?.[0] ? (
        <img src={item.product.images[0]} alt="" style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'cover' }} />
      ) : (
        <div style={{ width: 64, height: 64, borderRadius: 8, background: 'var(--color-bg)' }} />
      )}
    </Link>

    <div style={{ flex: 1, minWidth: 0 }}>
      <Link to={`/products/${item.product._id}`} style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>
        {item.product.name}
      </Link>
      <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
        {formatCurrency(item.unitPrice)} each
      </div>
      {item.stockLimited && (
        <div className="flex items-center gap-1" style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-warning)', marginTop: 4 }}>
          <FiAlertTriangle size={12} /> Only {item.product.currentStock} in stock — quantity reduced
        </div>
      )}
    </div>

    <div className="flex items-center gap-2">
      <button className="btn btn--outline btn--sm btn--icon" onClick={() => onDecrement(item)}>
        <FiMinus size={12} />
      </button>
      <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
      <button
        className="btn btn--outline btn--sm btn--icon"
        onClick={() => onIncrement(item)}
        disabled={item.quantity >= item.product.currentStock}
      >
        <FiPlus size={12} />
      </button>
    </div>

    <span style={{ fontWeight: 600, minWidth: 80, textAlign: 'right' }}>{formatCurrency(item.subtotal)}</span>

    <button className="btn btn--ghost btn--sm btn--icon" onClick={() => onRemove(item)} title="Remove">
      <FiTrash2 size={14} color="var(--color-danger)" />
    </button>
  </div>
);

export default CartItemRow;
