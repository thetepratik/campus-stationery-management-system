import { FiPlusCircle, FiEdit3 } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';

const availabilityBadge = (product) => {
  if (product.currentStock <= 0) return <span className="badge badge--outofstock">Out of Stock</span>;
  if (product.currentStock <= product.minStock) return <span className="badge badge--lowstock">Low Stock</span>;
  return <span className="badge badge--instock">In Stock</span>;
};

const StockLevelsTable = ({ products = [], onRestock, onAdjust }) => {
  if (!products.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>No products found</div>;
  }

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Category</th>
            <th>Current Stock</th>
            <th>Min / Max</th>
            <th>Stock Value</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p._id}>
              <td>
                <div className="flex items-center gap-2">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 32, height: 32, borderRadius: 6, background: 'var(--color-bg)' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{p.sku}</div>
                  </div>
                </div>
              </td>
              <td>{p.category?.name || '—'}</td>
              <td style={{ fontWeight: 600 }}>{p.currentStock}</td>
              <td style={{ color: 'var(--color-text-muted)', fontSize: 'var(--font-size-xs)' }}>
                {p.minStock} / {p.maxStock}
              </td>
              <td>{formatCurrency(p.currentStock * p.purchasePrice)}</td>
              <td>{availabilityBadge(p)}</td>
              <td>
                <div className="flex gap-2">
                  <button className="btn btn--outline btn--sm" onClick={() => onRestock(p)} title="Restock">
                    <FiPlusCircle size={14} /> Restock
                  </button>
                  <button className="btn btn--ghost btn--sm" onClick={() => onAdjust(p)} title="Adjust stock">
                    <FiEdit3 size={14} /> Adjust
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

export default StockLevelsTable;
