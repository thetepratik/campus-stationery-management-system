import { useState } from 'react';
import { FiSearch, FiX, FiCalendar, FiFilter } from 'react-icons/fi';

const STANDARD_DEPARTMENTS = [
  'AI & DS',
  'CSE',
  'IT',
  'ENTC',
  'Mechanical',
  'Civil',
  'Other',
];

const DATE_RANGE_OPTIONS = [
  { label: 'All Dates', value: 'all' },
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'this-week' },
  { label: 'This Month', value: 'this-month' },
  { label: 'Custom', value: 'custom' },
];

const SORT_OPTIONS = [
  { label: 'Newest Customer', sortBy: 'createdAt', sortOrder: 'desc' },
  { label: 'Oldest Customer', sortBy: 'createdAt', sortOrder: 'asc' },
  { label: 'Name (A–Z)', sortBy: 'name', sortOrder: 'asc' },
  { label: 'Highest Orders', sortBy: 'totalOrders', sortOrder: 'desc' },
  { label: 'Highest Spent', sortBy: 'totalSpent', sortOrder: 'desc' },
  { label: 'Last Purchase', sortBy: 'lastPurchase', sortOrder: 'desc' },
];

const CustomerFilters = ({
  filters = {},
  departments = [],
  onChange,
  onReset,
}) => {
  const [dateMode, setDateMode] = useState('all');

  // Merge dynamic backend departments with standard list without duplicates
  const allDepartments = Array.from(
    new Set([
      ...departments.filter(Boolean),
      ...STANDARD_DEPARTMENTS,
    ])
  );

  const update = (patch) => {
    onChange({ ...filters, page: 1, ...patch });
  };

  const handleDatePresetChange = (preset) => {
    setDateMode(preset);
    const now = new Date();
    let from = '';
    let to = '';

    if (preset === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      from = todayStr;
      to = todayStr;
    } else if (preset === 'this-week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      const startOfWeek = new Date(now.setDate(diff));
      from = startOfWeek.toISOString().split('T')[0];
      to = new Date().toISOString().split('T')[0];
    } else if (preset === 'this-month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      from = startOfMonth.toISOString().split('T')[0];
      to = new Date().toISOString().split('T')[0];
    } else if (preset === 'all') {
      from = '';
      to = '';
    }

    if (preset !== 'custom') {
      update({ from, to });
    }
  };

  const handleSortChange = (e) => {
    const selected = SORT_OPTIONS[parseInt(e.target.value, 10)] || SORT_OPTIONS[0];
    update({ sortBy: selected.sortBy, sortOrder: selected.sortOrder });
  };

  const currentSortIndex = SORT_OPTIONS.findIndex(
    (s) => s.sortBy === filters.sortBy && s.sortOrder === filters.sortOrder
  );

  const isFiltered =
    filters.search ||
    (filters.department && filters.department !== 'all') ||
    (filters.status && filters.status !== 'all') ||
    (filters.purchaseType && filters.purchaseType !== 'all') ||
    filters.from ||
    filters.to;

  return (
    <div style={{ marginBottom: 'var(--space-5)' }}>
      {/* Primary Row: Search and Key Dropdowns */}
      <div
        className="flex gap-3"
        style={{ flexWrap: 'wrap', alignItems: 'center', marginBottom: 'var(--space-3)' }}
      >
        {/* Search Box */}
        <div
          className="admin-topbar__search"
          style={{ width: 340, background: 'var(--color-bg)' }}
        >
          <FiSearch size={16} />
          <input
            type="text"
            id="customer-search-input"
            placeholder="Search customer, roll number, email or phone..."
            value={filters.search || ''}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>

        {/* Department Filter */}
        <select
          id="customer-department-filter"
          className="form-select"
          style={{ width: 170 }}
          value={filters.department || ''}
          onChange={(e) => update({ department: e.target.value })}
        >
          <option value="">All Departments</option>
          {allDepartments.map((dept) => (
            <option key={dept} value={dept}>
              {dept}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          id="customer-status-filter"
          className="form-select"
          style={{ width: 140 }}
          value={filters.status || ''}
          onChange={(e) => update({ status: e.target.value })}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="blocked">Blocked</option>
        </select>

        {/* Purchase Type Filter */}
        <select
          id="customer-purchase-type-filter"
          className="form-select"
          style={{ width: 150 }}
          value={filters.purchaseType || 'all'}
          onChange={(e) => update({ purchaseType: e.target.value })}
        >
          <option value="all">All Purchases</option>
          <option value="online">Online Buyers</option>
          <option value="offline">Offline Buyers</option>
        </select>

        {/* Sort Dropdown */}
        <select
          id="customer-sort-filter"
          className="form-select"
          style={{ width: 170 }}
          value={currentSortIndex >= 0 ? currentSortIndex : 0}
          onChange={handleSortChange}
        >
          {SORT_OPTIONS.map((opt, idx) => (
            <option key={idx} value={idx}>
              Sort: {opt.label}
            </option>
          ))}
        </select>

        {/* Clear Filters button */}
        {isFiltered && (
          <button
            type="button"
            className="btn btn--outline btn--sm"
            onClick={() => {
              setDateMode('all');
              onReset();
            }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
          >
            <FiX size={14} /> Clear Filters
          </button>
        )}
      </div>

      {/* Date Range Selector Row */}
      <div
        className="flex items-center gap-2"
        style={{ flexWrap: 'wrap', fontSize: 'var(--font-size-xs)' }}
      >
        <span
          style={{
            color: 'var(--color-text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontWeight: 500,
          }}
        >
          <FiCalendar size={13} /> Registered / Activity:
        </span>
        {DATE_RANGE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            className={`btn btn--sm ${
              dateMode === opt.value ? 'btn--primary' : 'btn--outline'
            }`}
            style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }}
            onClick={() => handleDatePresetChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}

        {dateMode === 'custom' && (
          <div className="flex items-center gap-2" style={{ marginLeft: 6 }}>
            <input
              type="date"
              className="form-input"
              style={{ width: 140, padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              value={filters.from || ''}
              onChange={(e) => update({ from: e.target.value })}
              title="From date"
            />
            <span style={{ color: 'var(--color-text-muted)' }}>to</span>
            <input
              type="date"
              className="form-input"
              style={{ width: 140, padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}
              value={filters.to || ''}
              onChange={(e) => update({ to: e.target.value })}
              title="To date"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerFilters;
