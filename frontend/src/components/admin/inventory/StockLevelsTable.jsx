import { FiPlusCircle, FiEdit3, FiImage } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getImageUrl } from '../../../utils/imageUrl';

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
                    <img
                      src={getImageUrl(p.images[0], p._id, 0)}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) e.currentTarget.nextElementSibling.style.display = 'flex';
                      }}
                      style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: p.images?.[0] ? 'none' : 'flex',
                      width: 32,
                      height: 32,
                      borderRadius: 6,
                      background: 'var(--color-bg)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <FiImage color="var(--color-text-muted)" size={14} />
                  </div>
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
