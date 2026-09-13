import { FiEdit2, FiTrash2, FiImage } from 'react-icons/fi';

const CategoryGrid = ({ categories = [], onEdit, onDelete }) => {
  if (!categories.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-10) 0' }}>No categories yet. Add your first one.</div>;
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: 'var(--space-4)',
      }}
    >
      {categories.map((cat) => (
        <div className="card card--hoverable" key={cat._id} style={{ overflow: 'hidden' }}>
          <div
            style={{
              height: 120,
              background: cat.image ? `url(${cat.image}) center/cover` : 'var(--color-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--color-text-muted)',
            }}
          >
            {!cat.image && <FiImage size={28} />}
          </div>
          <div style={{ padding: 'var(--space-4)' }}>
            <div className="flex items-center justify-between">
              <h4 style={{ fontSize: 'var(--font-size-base)' }}>{cat.name}</h4>
              <span className={`badge ${cat.isActive ? 'badge--instock' : 'badge--outofstock'}`}>
                {cat.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', margin: '4px 0 12px' }}>
              {cat.productCount} product{cat.productCount === 1 ? '' : 's'}
            </p>
            <div className="flex gap-2">
              <button className="btn btn--outline btn--sm" style={{ flex: 1 }} onClick={() => onEdit(cat)}>
                <FiEdit2 size={14} /> Edit
              </button>
              <button className="btn btn--ghost btn--sm btn--icon" onClick={() => onDelete(cat)} aria-label="Delete category">
                <FiTrash2 size={14} color="var(--color-danger)" />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryGrid;
