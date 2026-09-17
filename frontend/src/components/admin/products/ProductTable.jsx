import { FiEdit2, FiTrash2, FiImage, FiBox, FiCheckCircle, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import { formatCurrency } from '../../../utils/formatCurrency';

const getStockBadge = (product) => {
  if (product.currentStock <= 0) {
    return {
      label: 'Out of Stock',
      cls: 'badge--outofstock',
      icon: <FiXCircle size={12} />,
    };
  }
  if (product.currentStock <= (product.minStock || 10)) {
    return {
      label: 'Low Stock',
      cls: 'badge--lowstock',
      icon: <FiAlertTriangle size={12} />,
    };
  }
  return {
    label: 'In Stock',
    cls: 'badge--instock',
    icon: <FiCheckCircle size={12} />,
  };
};

const ProductTable = ({
  products = [],
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  onEdit,
  onDelete,
}) => {
  if (!products.length) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-10) 0' }}>
        <FiBox size={36} style={{ color: 'var(--color-text-muted)' }} />
        <div style={{ fontWeight: 600 }}>No products match your search or filters.</div>
        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
          Try changing your search keywords or resetting active filter chips.
        </div>
      </div>
    );
  }

  const allSelected = products.length > 0 && products.every((p) => selectedIds.includes(p._id));

  return (
    <>
      {/* Desktop Table View */}
      <div className="table-wrapper admin-product-table-desktop">
        <table className="table admin-product-table">
          <thead>
            <tr>
              <th style={{ width: 38 }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => onToggleSelectAll(e.target.checked)}
                  aria-label="Select all products"
                />
              </th>
              <th style={{ width: 60 }}>Image</th>
              <th>Product Details</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Sold</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const stockBadge = getStockBadge(p);
              const isSelected = selectedIds.includes(p._id);

              return (
                <tr key={p._id} style={{ background: isSelected ? 'var(--color-primary-light)' : undefined }}>
                  <td>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(p._id)}
                      aria-label={`Select ${p.name}`}
                    />
                  </td>
                  <td>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.images?.[0] ? (
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          loading="lazy"
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                        />
                      ) : (
                        <FiImage color="var(--color-text-muted)" size={20} />
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="admin-product-table__title">{p.name}</div>
                    <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                      {p.brand && <span className="admin-product-table__brand">{p.brand}</span>}
                      <span className="admin-product-table__sku">SKU: {p.sku}</span>
                      {p.barcode && <span className="admin-product-table__sku">Bar: {p.barcode}</span>}
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '0.2rem 0.55rem',
                        borderRadius: 'var(--radius-sm)',
                        background: 'var(--color-bg)',
                        border: '1px solid var(--color-border)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: 500,
                      }}
                    >
                      {p.category?.name || '—'}
                    </span>
                  </td>
                  <td>
                    <div style={{ fontWeight: 700 }}>{formatCurrency(p.sellingPrice)}</div>
                    {p.discountPercent > 0 && (
                      <span style={{ fontSize: 10, color: 'var(--color-primary)', fontWeight: 600 }}>
                        {p.discountPercent}% OFF
                      </span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <span style={{ fontWeight: 700, marginRight: 4 }}>{p.currentStock}</span>
                      <span className={`badge ${stockBadge.cls} flex items-center gap-1`}>
                        {stockBadge.icon} {stockBadge.label}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                      {p.soldCount || 0}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${p.status === 'active' ? 'badge--instock' : 'badge--outofstock'}`}>
                      {p.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-1 justify-end">
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm btn--icon"
                        onClick={() => onEdit(p)}
                        title="Edit product"
                        aria-label={`Edit ${p.name}`}
                      >
                        <FiEdit2 size={14} color="var(--color-primary)" />
                      </button>
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm btn--icon"
                        onClick={() => onDelete(p)}
                        title="Delete product"
                        aria-label={`Delete ${p.name}`}
                      >
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

      {/* Mobile Responsive Cards View */}
      <div className="admin-product-mobile-cards">
        {products.map((p) => {
          const stockBadge = getStockBadge(p);
          const isSelected = selectedIds.includes(p._id);

          return (
            <div
              key={p._id}
              className="admin-product-mobile-card"
              style={{
                borderColor: isSelected ? 'var(--color-primary)' : undefined,
                background: isSelected ? 'var(--color-primary-light)' : undefined,
              }}
            >
              <div className="admin-product-mobile-card__top">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleSelect(p._id)}
                  style={{ marginTop: 4 }}
                  aria-label={`Select ${p.name}`}
                />
                {p.images?.[0] ? (
                  <img src={p.images[0]} alt={p.name} className="admin-product-mobile-card__img" />
                ) : (
                  <div
                    className="admin-product-mobile-card__img flex items-center justify-center"
                    style={{ background: 'var(--color-bg)' }}
                  >
                    <FiImage color="var(--color-text-muted)" size={18} />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="admin-product-table__title">{p.name}</div>
                  <div className="flex items-center gap-2" style={{ marginTop: 2, flexWrap: 'wrap' }}>
                    {p.brand && <span className="admin-product-table__brand">{p.brand}</span>}
                    <span className="admin-product-table__sku">SKU: {p.sku}</span>
                  </div>
                  <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    Category: <strong>{p.category?.name || '—'}</strong>
                  </div>
                </div>
              </div>

              <div className="admin-product-mobile-card__meta">
                <div>
                  <span style={{ fontWeight: 800, fontSize: 'var(--font-size-md)' }}>
                    {formatCurrency(p.sellingPrice)}
                  </span>
                  <span style={{ marginLeft: 8, color: 'var(--color-text-muted)' }}>
                    Stock: <strong>{p.currentStock}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <span className={`badge ${stockBadge.cls} flex items-center gap-1`}>
                    {stockBadge.icon} {stockBadge.label}
                  </span>
                  <span className={`badge ${p.status === 'active' ? 'badge--instock' : 'badge--outofstock'}`}>
                    {p.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2" style={{ paddingTop: 'var(--space-2)', borderTop: '1px solid var(--color-border)' }}>
                <button
                  type="button"
                  className="btn btn--outline btn--sm flex items-center gap-1"
                  onClick={() => onEdit(p)}
                >
                  <FiEdit2 size={13} /> Edit
                </button>
                <button
                  type="button"
                  className="btn btn--outline btn--sm flex items-center gap-1"
                  onClick={() => onDelete(p)}
                  style={{ color: 'var(--color-danger)', borderColor: 'var(--color-danger-light)' }}
                >
                  <FiTrash2 size={13} /> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
};

export default ProductTable;
