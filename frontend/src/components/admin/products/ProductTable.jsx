import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';

const availabilityBadge = (product) => {
  if (product.currentStock <= 0) return { label: 'Out of Stock', cls: 'outofstock' };
  if (product.currentStock <= product.minStock) return { label: 'Low Stock', cls: 'lowstock' };
  return { label: 'In Stock', cls: 'instock' };
};

const ProductTable = ({ products = [], selectedIds, onToggleSelect, onToggleSelectAll, onEdit, onDelete }) => {
  if (!products.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-10) 0' }}>No products match your filters.</div>;
  }

  const allSelected = products.length > 0 && products.every((p) => selectedIds.includes(p._id));

  return (
    <div className="table-wrapper">
      <table className="table">
        <thead>
          <tr>
            <th style={{ width: 36 }}>
              <input type="checkbox" checked={allSelected} onChange={(e) => onToggleSelectAll(e.target.checked)} />
            </th>
            <th>Image</th>
            <th>Product Name</th>
            <th>Category</th>
            <th>Price (₹)</th>
            <th>Stock</th>
            <th>Sold</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const avail = availabilityBadge(p);
            return (
              <tr key={p._id}>
                <td>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(p._id)}
                    onChange={() => onToggleSelect(p._id)}
                  />
                </td>
                <td>
                  <div
                    style={{
                      width: 40, height: 40, borderRadius: 'var(--radius-sm)', overflow: 'hidden',
                      background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <FiImage color="var(--color-text-muted)" />
                    )}
                  </div>
                </td>
                <td>
                  <div style={{ fontWeight: 500 }}>{p.name}</div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{p.sku}</div>
                </td>
                <td>{p.category?.name || '—'}</td>
                <td>{formatCurrency(p.sellingPrice)}</td>
                <td>
                  <span className={`badge badge--${avail.cls}`}>{p.currentStock}</span>
                </td>
                <td>{p.soldCount || 0}</td>
                <td>
                  <span className={`badge ${p.status === 'active' ? 'badge--instock' : 'badge--outofstock'}`}>
                    {p.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button className="btn btn--ghost btn--sm btn--icon" onClick={() => onEdit(p)} aria-label="Edit">
                      <FiEdit2 size={14} />
                    </button>
                    <button className="btn btn--ghost btn--sm btn--icon" onClick={() => onDelete(p)} aria-label="Delete">
                      <FiTrash2 size={14} color="var(--color-danger)" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ProductTable;
