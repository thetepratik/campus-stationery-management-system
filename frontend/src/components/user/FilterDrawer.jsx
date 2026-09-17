import { useState, useEffect } from 'react';
import { FiX, FiCheck, FiRotateCcw } from 'react-icons/fi';

const AVAILABILITY_OPTIONS = [
  { value: '', label: 'All' },
  { value: 'in-stock', label: 'In Stock' },
  { value: 'low-stock', label: 'Low Stock' },
  { value: 'out-of-stock', label: 'Out of Stock' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'name-asc', label: 'Name: A to Z' },
  { value: 'name-desc', label: 'Name: Z to A' },
  { value: 'newest', label: 'Newest' },
];

const FilterDrawer = ({
  open,
  onClose,
  categories = [],
  brands = [],
  filters = {},
  onApply,
  onClear,
}) => {
  const [draft, setDraft] = useState({
    category: filters.category || '',
    brand: filters.brand || '',
    minPrice: filters.minPrice || '',
    maxPrice: filters.maxPrice || '',
    availability: filters.availability || '',
    sort: filters.sort || 'relevance',
  });

  // Sync draft whenever drawer opens or external filters change
  useEffect(() => {
    if (open) {
      setDraft({
        category: filters.category || '',
        brand: filters.brand || '',
        minPrice: filters.minPrice || '',
        maxPrice: filters.maxPrice || '',
        availability: filters.availability || '',
        sort: filters.sort || 'relevance',
      });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open, filters]);

  // Escape key handler
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const handleChange = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = (e) => {
    e?.preventDefault();
    onApply(draft);
    onClose();
  };

  const handleClear = () => {
    const cleared = {
      category: '',
      brand: '',
      minPrice: '',
      maxPrice: '',
      availability: '',
      sort: 'relevance',
    };
    setDraft(cleared);
    onClear();
    onClose();
  };

  return (
    <div className="filter-drawer-backdrop" onClick={onClose}>
      <div
        className="filter-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Product Filters"
      >
        {/* Drawer Header */}
        <div className="filter-drawer__header">
          <div className="flex items-center gap-2">
            <span style={{ fontWeight: 700, fontSize: 'var(--font-size-lg)' }}>Filters</span>
          </div>
          <button
            className="btn btn--icon filter-drawer__close-btn"
            onClick={onClose}
            aria-label="Close filters"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="filter-drawer__body">
          {/* 1. Category */}
          <div className="filter-drawer__section">
            <label className="filter-drawer__label">Category</label>
            <select
              className="form-select filter-drawer__select"
              value={draft.category}
              onChange={(e) => handleChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Brand */}
          <div className="filter-drawer__section">
            <label className="filter-drawer__label">Brand</label>
            <select
              className="form-select filter-drawer__select"
              value={draft.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
            >
              <option value="">All Brands</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Price Range */}
          <div className="filter-drawer__section">
            <label className="filter-drawer__label">Price Range (₹)</label>
            <div className="flex items-center gap-2">
              <div className="filter-drawer__price-input-group">
                <span className="filter-drawer__currency">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Min"
                  value={draft.minPrice}
                  onChange={(e) => handleChange('minPrice', e.target.value)}
                  className="form-input filter-drawer__price-input"
                />
              </div>
              <span style={{ color: 'var(--color-text-muted)' }}>—</span>
              <div className="filter-drawer__price-input-group">
                <span className="filter-drawer__currency">₹</span>
                <input
                  type="number"
                  min="0"
                  placeholder="Max"
                  value={draft.maxPrice}
                  onChange={(e) => handleChange('maxPrice', e.target.value)}
                  className="form-input filter-drawer__price-input"
                />
              </div>
            </div>
          </div>

          {/* 4. Availability */}
          <div className="filter-drawer__section">
            <label className="filter-drawer__label">Availability</label>
            <div className="filter-drawer__radio-group">
              {AVAILABILITY_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`filter-drawer__radio-pill ${
                    draft.availability === opt.value ? 'filter-drawer__radio-pill--active' : ''
                  }`}
                >
                  <input
                    type="radio"
                    name="availability"
                    value={opt.value}
                    checked={draft.availability === opt.value}
                    onChange={() => handleChange('availability', opt.value)}
                    style={{ display: 'none' }}
                  />
                  <span className="filter-drawer__radio-dot" />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* 5. Sort By */}
          <div className="filter-drawer__section">
            <label className="filter-drawer__label">Sort By</label>
            <select
              className="form-select filter-drawer__select"
              value={draft.sort}
              onChange={(e) => handleChange('sort', e.target.value)}
            >
              {SORT_OPTIONS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Drawer Actions Footer */}
        <div className="filter-drawer__footer">
          <button
            type="button"
            className="btn btn--secondary filter-drawer__clear-btn flex items-center justify-center gap-1"
            onClick={handleClear}
          >
            <FiRotateCcw size={14} /> Clear All
          </button>
          <button
            type="button"
            className="btn btn--primary filter-drawer__apply-btn flex items-center justify-center gap-1"
            onClick={handleApply}
          >
            <FiCheck size={16} /> Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
