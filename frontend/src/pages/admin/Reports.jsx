import { useState } from 'react';
import SalesReport from './SalesReport';
import { FiDollarSign, FiLayers, FiBox } from 'react-icons/fi';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('sales');

  return (
    <div className="reports-container">
      {/* Tab Navigation */}
      <div
        className="flex items-center gap-2 no-print"
        style={{
          borderBottom: '1px solid var(--color-border)',
          marginBottom: 'var(--space-6)',
          paddingBottom: 'var(--space-2)',
        }}
      >
        <button
          className={`btn btn--sm ${activeTab === 'sales' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('sales')}
          style={{ gap: 6 }}
        >
          <FiDollarSign size={15} />
          <span>Sales Report</span>
        </button>

        <button
          className={`btn btn--sm ${activeTab === 'inventory' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('inventory')}
          style={{ gap: 6 }}
        >
          <FiLayers size={15} />
          <span>Inventory Analytics</span>
        </button>

        <button
          className={`btn btn--sm ${activeTab === 'products' ? 'btn--primary' : 'btn--ghost'}`}
          onClick={() => setActiveTab('products')}
          style={{ gap: 6 }}
        >
          <FiBox size={15} />
          <span>Product Performance</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'sales' && <SalesReport />}

      {activeTab === 'inventory' && (
        <div className="card panel" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
          <FiLayers size={40} color="var(--color-primary)" style={{ margin: '0 auto var(--space-3)' }} />
          <h3>Inventory Analytics</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 4 }}>
            For real-time stock levels, low-stock alerts, and restocking history, please visit the{' '}
            <a href="/admin/inventory" style={{ color: 'var(--color-primary)', fontWeight: 600, textDecoration: 'underline' }}>
              Inventory Management
            </a>{' '}
            page.
          </p>
        </div>
      )}

      {activeTab === 'products' && (
        <div className="card panel" style={{ padding: 'var(--space-10)', textAlign: 'center' }}>
          <FiBox size={40} color="var(--color-primary)" style={{ margin: '0 auto var(--space-3)' }} />
          <h3>Product Performance</h3>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 4 }}>
            Top and least selling product statistics are available directly inside the{' '}
            <button
              onClick={() => setActiveTab('sales')}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-primary)',
                fontWeight: 600,
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Sales Report
            </button>{' '}
            tab.
          </p>
        </div>
      )}
    </div>
  );
};

export default Reports;
