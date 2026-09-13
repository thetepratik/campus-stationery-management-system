import { formatCurrency } from '../../../utils/formatCurrency';

const InventoryValueByCategory = ({ byCategory = [] }) => {
  if (!byCategory.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>No inventory data yet</div>;
  }

  const maxValue = Math.max(...byCategory.map((c) => c.value), 1);

  return (
    <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
      {byCategory.map((c) => {
        const pct = Math.round((c.value / maxValue) * 100);
        return (
          <li key={c.name}>
            <div className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>
              <span style={{ fontWeight: 500 }}>{c.name}</span>
              <span style={{ color: 'var(--color-text-muted)' }}>
                {formatCurrency(c.value)} · {c.units} units
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--color-bg)', borderRadius: 'var(--radius-full)' }}>
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'linear-gradient(90deg, var(--color-primary), var(--color-secondary))',
                  borderRadius: 'var(--radius-full)',
                  transition: 'width 0.4s ease',
                }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default InventoryValueByCategory;
