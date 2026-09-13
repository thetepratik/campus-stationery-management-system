import { FiSearch } from 'react-icons/fi';
import { STATUS_LABELS } from '../../../utils/orderStatus';

const STATUS_TABS = ['', 'pending', 'confirmed', 'packing', 'ready-for-pickup', 'collected', 'completed', 'cancelled'];

const OrderFilters = ({ filters, onChange }) => {
  const update = (patch) => onChange({ ...filters, page: 1, ...patch });

  return (
    <div>
      <div className="flex gap-2" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-4)', overflowX: 'auto' }}>
        {STATUS_TABS.map((s) => (
          <button
            key={s || 'all'}
            className={`btn btn--sm ${filters.status === s ? 'btn--primary' : 'btn--outline'}`}
            onClick={() => update({ status: s })}
          >
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      <div className="flex gap-3" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
        <div className="admin-topbar__search" style={{ width: 260, background: 'var(--color-bg)' }}>
          <FiSearch size={16} />
          <input
            type="text"
            placeholder="Order ID, student name, roll no..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>
        <select className="form-select" style={{ width: 170 }} value={filters.paymentStatus} onChange={(e) => update({ paymentStatus: e.target.value })}>
          <option value="">All Payment Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <input type="date" className="form-input" style={{ width: 160 }} value={filters.from} onChange={(e) => update({ from: e.target.value })} title="From date" />
        <input type="date" className="form-input" style={{ width: 160 }} value={filters.to} onChange={(e) => update({ to: e.target.value })} title="To date" />
      </div>
    </div>
  );
};

export default OrderFilters;
