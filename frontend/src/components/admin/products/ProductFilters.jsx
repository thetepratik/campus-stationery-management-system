import { useState, useMemo } from 'react';
import { FiSearch, FiSliders, FiX, FiRotateCcw } from 'react-icons/fi';

const ProductFilters = ({ filters, onChange, categories = [], brands = [] }) => {
  const [showFilters, setShowFilters] = useState(false);

  const update = (patch) => onChange({ ...filters, page: 1, ...patch });

  const activeChips = useMemo(() => {
    const chips = [];
    if (filters.search && filters.search.trim()) {
      chips.push({ key: 'search', label: `Search: "${filters.search.trim()}"` });
    }
    if (filters.category) {
      const cat = categories.find((c) => c._id === filters.category);
      chips.push({ key: 'category', label: `Category: ${cat ? cat.name : 'Selected'}` });
    }
    if (filters.brand) {
      chips.push({ key: 'brand', label: `Brand: ${filters.brand}` });
    }
    if (filters.availability) {
      const map = {
        'in-stock': 'In Stock',
        'low-stock': 'Low Stock',
        'out-of-stock': 'Out of Stock',
      };
      chips.push({ key: 'availability', label: `Stock: ${map[filters.availability] || filters.availability}` });
    }
    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice ? `₹${filters.minPrice}` : '₹0';
      const max = filters.maxPrice ? `₹${filters.maxPrice}` : 'Above';
      chips.push({ key: 'price', label: `Price: ${min} - ${max}` });
    }
    if (filters.status) {
      chips.push({ key: 'status', label: `Status: ${filters.status === 'active' ? 'Active' : 'Inactive'}` });
    }
    return chips;
  }, [filters, categories]);

  const handleRemoveChip = (key) => {
    if (key === 'price') {
      update({ minPrice: '', maxPrice: '' });
    } else {
      update({ [key]: '' });
    }
  };

  const handleClearAll = () => {
    onChange({
      search: '',
      category: '',
      brand: '',
      availability: '',
      minPrice: '',
      maxPrice: '',
      status: '',
      sort: 'newest',
      page: 1,
    });
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.brand) count++;
    if (filters.availability) count++;
    if (filters.minPrice || filters.maxPrice) count++;
    if (filters.status) count++;
    return count;
  }, [filters]);

  return (
    <div style={{ marginBottom: 'var(--space-4)' }}>
      {/* Top Search & Filter Bar */}
      <div className="admin-product-search-bar">
        <FiSearch size={18} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
        <input
          type="text"
          className="admin-product-search-bar__input"
          placeholder="Search products by name, brand, SKU, barcode..."
          value={filters.search || ''}
          onChange={(e) => update({ search: e.target.value })}
          aria-label="Search admin products"
        />
        {filters.search && (
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--icon"
            onClick={() => update({ search: '' })}
            aria-label="Clear search"
          >
            <FiX size={16} />
          </button>
        )}

        <button
          type="button"
          className="admin-product-search-bar__filter-btn"
          onClick={() => setShowFilters((prev) => !prev)}
          style={{
            borderColor: showFilters || activeFilterCount > 0 ? 'var(--color-primary)' : undefined,
            background: showFilters || activeFilterCount > 0 ? 'var(--color-primary-light)' : undefined,
            color: showFilters || activeFilterCount > 0 ? 'var(--color-primary)' : undefined,
          }}
          aria-label="Toggle filter controls"
        >
          <FiSliders size={14} /> Filter
          {activeFilterCount > 0 && (
            <span
              style={{
                background: 'var(--color-primary)',
                color: '#fff',
                borderRadius: '50%',
                width: 18,
                height: 18,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Filter Panel */}
      {showFilters && (
        <div className="admin-product-filters-panel">
          {/* Category */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Category</label>
            <select
              className="form-select"
              value={filters.category || ''}
              onChange={(e) => update({ category: e.target.value })}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Brand */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Brand</label>
            <select
              className="form-select"
              value={filters.brand || ''}
              onChange={(e) => update({ brand: e.target.value })}
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          {/* Stock Availability */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Stock Status</label>
            <select
              className="form-select"
              value={filters.availability || ''}
              onChange={(e) => update({ availability: e.target.value })}
            >
              <option value="">All Stock</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          {/* Price Range: Min & Max */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Price Range (₹)</label>
            <div className="flex gap-1 items-center">
              <input
                type="number"
                min="0"
                placeholder="Min"
                className="form-input"
                style={{ width: '50%' }}
                value={filters.minPrice || ''}
                onChange={(e) => update({ minPrice: e.target.value })}
              />
              <span style={{ color: 'var(--color-text-muted)' }}>-</span>
              <input
                type="number"
                min="0"
                placeholder="Max"
                className="form-input"
                style={{ width: '50%' }}
                value={filters.maxPrice || ''}
                onChange={(e) => update({ maxPrice: e.target.value })}
              />
            </div>
          </div>

          {/* Status */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Product Status</label>
            <select
              className="form-select"
              value={filters.status || ''}
              onChange={(e) => update({ status: e.target.value })}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Sort */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ fontSize: 11 }}>Sort By</label>
            <select
              className="form-select"
              value={filters.sort || 'newest'}
              onChange={(e) => update({ sort: e.target.value })}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name-asc">Name (A-Z)</option>
              <option value="name-desc">Name (Z-A)</option>
              <option value="price-asc">Price (Low-High)</option>
              <option value="price-desc">Price (High-Low)</option>
              <option value="stock-asc">Stock (Low-High)</option>
              <option value="stock-desc">Stock (High-Low)</option>
              <option value="sold-desc">Best Selling</option>
            </select>
          </div>
        </div>
      )}

      {/* Active Filter Chips */}
      {activeChips.length > 0 && (
        <div className="active-filters-bar" style={{ marginTop: 'var(--space-2)' }}>
          {activeChips.map((chip) => (
            <span key={chip.key} className="filter-chip">
              {chip.label}
              <button
                type="button"
                className="filter-chip__remove"
                onClick={() => handleRemoveChip(chip.key)}
                aria-label={`Remove filter ${chip.label}`}
              >
                <FiX size={12} />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="filter-chip filter-chip--clear-all flex items-center gap-1"
            onClick={handleClearAll}
          >
            <FiRotateCcw size={12} /> Clear All
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductFilters;
