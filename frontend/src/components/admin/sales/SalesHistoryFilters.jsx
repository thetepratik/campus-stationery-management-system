import { FiSearch } from 'react-icons/fi';

const SalesHistoryFilters = ({ filters, onChange }) => {
  const update = (patch) => onChange({ ...filters, page: 1, ...patch });

  return (
    <div className="flex gap-3" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
      <div className="admin-topbar__search" style={{ width: 240, background: 'var(--color-bg)' }}>
        <FiSearch size={16} />
        <input
          type="text"
          placeholder="Sale ID, customer, roll no..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
      </div>

      <select
        className="form-select"
        style={{ width: 170 }}
        value={filters.paymentMethod}
        onChange={(e) => update({ paymentMethod: e.target.value })}
      >
        <option value="">All Payment Methods</option>
        <option value="cash">Cash</option>
        <option value="upi">UPI</option>
        <option value="gpay">Google Pay</option>
        <option value="phonepe">PhonePe</option>
        <option value="paytm">Paytm</option>
      </select>

      <select
        className="form-select"
        style={{ width: 150 }}
        value={filters.status || ''}
        onChange={(e) => update({ status: e.target.value })}
      >
        <option value="">All Statuses</option>
        <option value="completed">Completed</option>
        <option value="reversed">Reversed</option>
      </select>

      <input type="date" className="form-input" style={{ width: 160 }} value={filters.from} onChange={(e) => update({ from: e.target.value })} title="From date" />
      <input type="date" className="form-input" style={{ width: 160 }} value={filters.to} onChange={(e) => update({ to: e.target.value })} title="To date" />
    </div>
  );
};

export default SalesHistoryFilters;
