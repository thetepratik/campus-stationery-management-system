import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiPlus } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import { productApi } from '../../../services/productApi';
import useDebounce from '../../../hooks/useDebounce';
import { formatCurrency } from '../../../utils/formatCurrency';

const ProductSearchPanel = ({ onAdd, cartQuantities }) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 350);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await productApi.list({ search: debouncedSearch, status: 'active', limit: 12, sort: 'name-asc' });
      setProducts(res.data.products);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const availabilityBadge = (p) => {
    if (p.currentStock <= 0) return <span className="badge badge--outofstock">Out of Stock</span>;
    if (p.currentStock <= p.minStock) return <span className="badge badge--lowstock">Low: {p.currentStock}</span>;
    return <span className="badge badge--instock">{p.currentStock} in stock</span>;
  };

  return (
    <div className="card panel">
      <div className="panel__header">
        <span className="panel__title">Find a Product</span>
      </div>
      <div className="admin-topbar__search" style={{ width: '100%', background: 'var(--color-bg)', marginBottom: 'var(--space-4)' }}>
        <FiSearch size={16} />
        <input
          type="text"
          placeholder="Search by name, brand, or SKU..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
        />
      </div>

      {loading ? (
        <Skeleton height={64} count={5} style={{ marginBottom: 8 }} />
      ) : products.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>No products found</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', maxHeight: 520, overflowY: 'auto' }}>
          {products.map((p) => {
            const inCartQty = cartQuantities[p._id] || 0;
            const remaining = p.currentStock - inCartQty;
            const disabled = remaining <= 0;
            return (
              <div
                key={p._id}
                className="flex items-center justify-between"
                style={{ padding: 'var(--space-3)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)' }}
              >
                <div className="flex items-center gap-3">
                  {p.images?.[0] ? (
                    <img src={p.images[0]} alt="" style={{ width: 40, height: 40, borderRadius: 6, objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--color-bg)' }} />
                  )}
                  <div>
                    <div style={{ fontWeight: 500, fontSize: 'var(--font-size-sm)' }}>{p.name}</div>
                    <div className="flex items-center gap-2" style={{ marginTop: 2 }}>
                      <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                        {formatCurrency(p.sellingPrice)}
                      </span>
                      {availabilityBadge(p)}
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn--primary btn--sm"
                  disabled={disabled}
                  onClick={() => onAdd(p)}
                  title={disabled ? 'No more stock available' : 'Add to sale'}
                >
                  <FiPlus size={14} /> Add
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProductSearchPanel;
