import { FiSearch } from 'react-icons/fi';

const StockLevelsFilters = ({ filters, onChange, categories = [] }) => {
  const update = (patch) => onChange({ ...filters, page: 1, ...patch });

  return (
    <div className="flex gap-3" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
      <div className="admin-topbar__search" style={{ width: 260, background: 'var(--color-bg)' }}>
        <FiSearch size={16} />
        <input
          type="text"
          placeholder="Search by name or SKU..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
      </div>

      <select className="form-select" style={{ width: 180 }} value={filters.category} onChange={(e) => update({ category: e.target.value })}>
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>

      <select
        className="form-select"
        style={{ width: 170 }}
        value={filters.availability}
        onChange={(e) => update({ availability: e.target.value })}
      >
        <option value="">All Availability</option>
        <option value="in-stock">In Stock</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
      </select>
    </div>
  );
};

export default StockLevelsFilters;
