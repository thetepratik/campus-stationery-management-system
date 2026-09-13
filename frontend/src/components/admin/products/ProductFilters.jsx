import { FiSearch } from 'react-icons/fi';

const ProductFilters = ({ filters, onChange, categories = [] }) => {
  const update = (patch) => onChange({ ...filters, page: 1, ...patch });

  return (
    <div className="flex gap-3" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
      <div className="admin-topbar__search" style={{ width: 260, background: 'var(--color-bg)' }}>
        <FiSearch size={16} />
        <input
          type="text"
          placeholder="Search products..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
      </div>

      <select className="form-select" style={{ width: 170 }} value={filters.category} onChange={(e) => update({ category: e.target.value })}>
        <option value="">All Categories</option>
        {categories.map((c) => (
          <option key={c._id} value={c._id}>{c.name}</option>
        ))}
      </select>

      <select className="form-select" style={{ width: 150 }} value={filters.status} onChange={(e) => update({ status: e.target.value })}>
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      <select className="form-select" style={{ width: 160 }} value={filters.availability} onChange={(e) => update({ availability: e.target.value })}>
        <option value="">All Availability</option>
        <option value="in-stock">In Stock</option>
        <option value="low-stock">Low Stock</option>
        <option value="out-of-stock">Out of Stock</option>
      </select>

      <select className="form-select" style={{ width: 170 }} value={filters.sort} onChange={(e) => update({ sort: e.target.value })}>
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
  );
};

export default ProductFilters;
