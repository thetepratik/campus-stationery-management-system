const StockHistoryFilters = ({ filters, onChange }) => {
  const update = (patch) => onChange({ ...filters, page: 1, ...patch });

  return (
    <div className="flex gap-3" style={{ flexWrap: 'wrap', marginBottom: 'var(--space-4)' }}>
      <select className="form-select" style={{ width: 180 }} value={filters.type} onChange={(e) => update({ type: e.target.value })}>
        <option value="">All Movement Types</option>
        <option value="restock">Restock</option>
        <option value="sale-offline">Offline Sale</option>
        <option value="sale-online">Online Sale</option>
        <option value="adjustment">Adjustment</option>
        <option value="return">Return</option>
      </select>

      <input
        type="date"
        className="form-input"
        style={{ width: 160 }}
        value={filters.from}
        onChange={(e) => update({ from: e.target.value })}
        title="From date"
      />
      <input
        type="date"
        className="form-input"
        style={{ width: 160 }}
        value={filters.to}
        onChange={(e) => update({ to: e.target.value })}
        title="To date"
      />
    </div>
  );
};

export default StockHistoryFilters;
