import { FiAlertTriangle, FiXCircle } from 'react-icons/fi';

const StockAlertList = ({ products = [], type = 'low' }) => {
  if (!products.length) {
    return (
      <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>
        {type === 'low' ? 'No low stock items' : 'No out-of-stock items'}
      </div>
    );
  }

  return (
    <div>
      {products.map((p) => (
        <div className="mini-list-item" key={p._id}>
          <div className="flex items-center gap-2">
            {type === 'low' ? (
              <FiAlertTriangle size={14} color="var(--color-warning)" />
            ) : (
              <FiXCircle size={14} color="var(--color-danger)" />
            )}
            <span className="mini-list-item__name">{p.name}</span>
          </div>
          <span className={`badge badge--${type === 'low' ? 'lowstock' : 'outofstock'}`}>
            {type === 'low' ? `Stock: ${p.currentStock}` : 'Out of stock'}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StockAlertList;
