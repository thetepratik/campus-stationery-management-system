import { formatCurrency } from '../../../utils/formatCurrency';

const ProductMiniList = ({ products = [], emptyMessage = 'No products found', metric = 'sold' }) => {
  if (!products.length) {
    return <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>{emptyMessage}</div>;
  }

  return (
    <div>
      {products.map((p) => (
        <div className="mini-list-item" key={p._id}>
          <div>
            <div className="mini-list-item__name">{p.name}</div>
            <div className="mini-list-item__meta">{formatCurrency(p.sellingPrice)}</div>
          </div>
          <div className="mini-list-item__meta">
            {metric === 'sold' ? `${p.soldCount || 0} sold` : `${p.currentStock} in stock`}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProductMiniList;
