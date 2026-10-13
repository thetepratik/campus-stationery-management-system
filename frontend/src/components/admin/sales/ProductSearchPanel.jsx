import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { FiSearch, FiPlus, FiImage, FiX, FiLoader } from 'react-icons/fi';
import Skeleton from 'react-loading-skeleton';
import { productApi } from '../../../services/productApi';
import useDebounce from '../../../hooks/useDebounce';
import { formatCurrency } from '../../../utils/formatCurrency';
import { getImageUrl } from '../../../utils/imageUrl';

const ProductSearchPanel = ({ onAdd, cartQuantities }) => {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const searchInputRef = useRef(null);

  // Track latest query to prevent race condition where an older response overwrites a newer one
  const latestQueryIdRef = useRef(0);

  useEffect(() => {
    const currentQueryId = ++latestQueryIdRef.current;
    let isCancelled = false;

    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await productApi.list({
          search: debouncedSearch,
          status: 'active',
          limit: 12,
          sort: 'name-asc',
        });

        // Only commit results if this is still the active, non-cancelled request
        if (!isCancelled && currentQueryId === latestQueryIdRef.current) {
          setProducts(res.data.products || []);
        }
      } catch (err) {
        if (!isCancelled && currentQueryId === latestQueryIdRef.current) {
          toast.error(err.message || 'Failed to search products');
        }
      } finally {
        if (!isCancelled && currentQueryId === latestQueryIdRef.current) {
          setLoading(false);
        }
      }
    };

    fetchProducts();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch]);

  const handleClear = () => {
    setSearch('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const availabilityBadge = (p) => {
    if (p.currentStock <= 0) return <span className="badge badge--outofstock">Out of Stock</span>;
    if (p.currentStock <= p.minStock) return <span className="badge badge--lowstock">Low: {p.currentStock}</span>;
    return <span className="badge badge--instock">{p.currentStock} in stock</span>;
  };

  const isSearching = loading || search !== debouncedSearch;

  return (
    <div className="card panel">
      <div className="panel__header">
        <span className="panel__title">Find a Product</span>
      </div>

      {/* POS Product Search Bar (Visible on mobile, tablet, and desktop) */}
      <div
        id="pos-product-search-bar"
        className="pos-search-bar"
        role="search"
      >
        <FiSearch size={16} style={{ flexShrink: 0 }} />
        <input
          ref={searchInputRef}
          type="text"
          id="pos-product-search-input"
          placeholder="Search products by name, SKU or barcode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck="false"
        />

        {isSearching && (
          <FiLoader
            className="spin"
            size={16}
            style={{ color: 'var(--color-primary)', flexShrink: 0 }}
            aria-label="Searching products"
          />
        )}

        {search.length > 0 && (
          <button
            type="button"
            className="pos-search-bar__clear-btn"
            onClick={handleClear}
            aria-label="Clear search text"
            title="Clear search"
          >
            <FiX size={15} />
          </button>
        )}
      </div>

      {loading && products.length === 0 ? (
        <Skeleton height={64} count={5} style={{ marginBottom: 8, borderRadius: 'var(--radius-md)' }} />
      ) : products.length === 0 ? (
        <div className="empty-state" style={{ padding: 'var(--space-8) 0' }}>
          No products found
        </div>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-2)',
            maxHeight: 520,
            overflowY: 'auto',
            paddingRight: 2,
          }}
        >
          {products.map((p) => {
            const inCartQty = cartQuantities[p._id] || 0;
            const remaining = p.currentStock - inCartQty;
            const disabled = remaining <= 0;
            return (
              <div
                key={p._id}
                className="flex items-center justify-between"
                style={{
                  padding: 'var(--space-3)',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--radius-md)',
                  gap: 'var(--space-3)',
                }}
              >
                <div className="flex items-center gap-3" style={{ minWidth: 0, flex: 1 }}>
                  {p.images?.[0] ? (
                    <img
                      src={getImageUrl(p.images[0], p._id, 0)}
                      alt={p.name}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.nextElementSibling) {
                          e.currentTarget.nextElementSibling.style.display = 'flex';
                        }
                      }}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      display: p.images?.[0] ? 'none' : 'flex',
                      width: 40,
                      height: 40,
                      borderRadius: 6,
                      background: 'var(--color-bg)',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--color-border)',
                      flexShrink: 0,
                    }}
                  >
                    <FiImage color="var(--color-text-muted)" size={16} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 500,
                        fontSize: 'var(--font-size-sm)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={p.name}
                    >
                      {p.name}
                    </div>
                    <div
                      className="flex items-center gap-2"
                      style={{ marginTop: 2, flexWrap: 'wrap' }}
                    >
                      <span
                        style={{
                          fontSize: 'var(--font-size-xs)',
                          color: 'var(--color-text-muted)',
                          fontWeight: 600,
                        }}
                      >
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
                  style={{ flexShrink: 0 }}
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
