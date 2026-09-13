import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  FiBox,
  FiLayers,
  FiAlertTriangle,
  FiXCircle,
  FiShoppingBag,
  FiGlobe,
  FiDollarSign,
  FiClock,
} from 'react-icons/fi';

import { dashboardApi } from '../../services/dashboardApi';
import { formatCurrency } from '../../utils/formatCurrency';

import StatCard from '../../components/admin/dashboard/StatCard';
import SalesChart from '../../components/admin/dashboard/SalesChart';
import RevenueChart from '../../components/admin/dashboard/RevenueChart';
import PaymentMethodChart from '../../components/admin/dashboard/PaymentMethodChart';
import ProductMiniList from '../../components/admin/dashboard/ProductMiniList';
import StockAlertList from '../../components/admin/dashboard/StockAlertList';
import RecentOrdersTable from '../../components/admin/dashboard/RecentOrdersTable';
import RecentSalesTable from '../../components/admin/dashboard/RecentSalesTable';
import RecentNotifications from '../../components/admin/dashboard/RecentNotifications';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const fetchDashboard = async () => {
      try {
        const res = await dashboardApi.getFullDashboard();
        if (mounted) setData(res.data);
      } catch (err) {
        if (mounted) {
          setError(err.message);
          toast.error(err.message);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div>
        <div className="dashboard-stats-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div className="card" key={i} style={{ padding: 'var(--space-5)' }}>
              <Skeleton height={46} width={46} borderRadius={10} />
              <Skeleton height={14} width={100} style={{ marginTop: 12 }} />
              <Skeleton height={24} width={70} />
            </div>
          ))}
        </div>
        <div className="dashboard-charts-grid">
          <div className="card panel"><Skeleton height={260} /></div>
          <div className="card panel"><Skeleton height={260} /></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="empty-state card" style={{ padding: 'var(--space-10)' }}>
        <FiAlertTriangle size={32} color="var(--color-danger)" />
        <p>Couldn't load dashboard data. {error}</p>
        <p style={{ fontSize: 'var(--font-size-xs)' }}>
          Make sure the backend is running and connected to MongoDB, and that sample data has
          been seeded (<code>npm run seed</code> in /backend).
        </p>
      </div>
    );
  }

  const { summary, charts, products, inventoryAlerts, recent } = data;

  return (
    <div>
      {/* ---------- Stat Cards ---------- */}
      <div className="dashboard-stats-grid">
        <StatCard icon={FiBox} label="Total Products" value={summary.totalProducts} color="primary" />
        <StatCard icon={FiLayers} label="Available Stock" value={summary.availableStock.toLocaleString('en-IN')} color="secondary" />
        <StatCard icon={FiAlertTriangle} label="Low Stock" value={summary.lowStockCount} color="warning" />
        <StatCard icon={FiXCircle} label="Out of Stock" value={summary.outOfStockCount} color="danger" />
        <StatCard icon={FiShoppingBag} label="Today's Offline Sales" value={summary.todayOfflineSalesCount} color="primary" />
        <StatCard icon={FiGlobe} label="Today's Online Orders" value={summary.todayOnlineOrdersCount} color="info" />
        <StatCard icon={FiDollarSign} label="Today's Revenue" value={formatCurrency(summary.todayTotalRevenue)} color="secondary" />
        <StatCard icon={FiClock} label="Pending Orders" value={summary.pendingOrders} color="warning" />
      </div>

      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard icon={FiDollarSign} label="Monthly Revenue" value={formatCurrency(summary.monthlyRevenue)} color="secondary" />
        <StatCard icon={FiShoppingBag} label="Completed Orders" value={summary.completedOrders} color="secondary" />
        <StatCard icon={FiXCircle} label="Cancelled Orders" value={summary.cancelledOrders} color="danger" />
        <StatCard icon={FiLayers} label="Inventory Value" value={formatCurrency(summary.inventoryValue)} color="primary" />
      </div>

      {/* ---------- Charts ---------- */}
      <div className="dashboard-charts-grid">
        <div className="card panel">
          <div className="panel__header">
            <span className="panel__title">Sales Overview (Last 30 Days)</span>
          </div>
          <SalesChart labels={charts.salesChart.labels} data={charts.salesChart.data} />
        </div>
        <div className="card panel">
          <div className="panel__header">
            <span className="panel__title">Payment Method Split</span>
          </div>
          <PaymentMethodChart labels={charts.paymentMethodChart.labels} data={charts.paymentMethodChart.data} />
        </div>
      </div>

      <div className="dashboard-charts-grid">
        <div className="card panel">
          <div className="panel__header">
            <span className="panel__title">Revenue Overview (Last 30 Days)</span>
          </div>
          <RevenueChart labels={charts.revenueChart.labels} data={charts.revenueChart.data} />
        </div>
        <div className="card panel">
          <div className="panel__header">
            <span className="panel__title">Category Distribution</span>
          </div>
          {charts.categoryChart.labels.length ? (
            <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              {charts.categoryChart.labels.map((label, i) => {
                const max = Math.max(...charts.categoryChart.data, 1);
                const pct = Math.round((charts.categoryChart.data[i] / max) * 100);
                return (
                  <li key={label}>
                    <div className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 4 }}>
                      <span>{label}</span>
                      <span style={{ color: 'var(--color-text-muted)' }}>{charts.categoryChart.data[i]} products</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--color-bg)', borderRadius: 'var(--radius-full)' }}>
                      <div
                        style={{
                          height: '100%', width: `${pct}%`, background: 'var(--color-primary)',
                          borderRadius: 'var(--radius-full)', transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="empty-state" style={{ padding: 'var(--space-6) 0' }}>No categories yet</div>
          )}
        </div>
      </div>

      {/* ---------- Top Selling / Least Selling / Stock Alerts ---------- */}
      <div className="dashboard-panels-grid">
        <div className="card panel">
          <div className="panel__header"><span className="panel__title">Top Selling Products</span></div>
          <ProductMiniList products={products.topSelling} metric="sold" emptyMessage="No sales recorded yet" />
        </div>
        <div className="card panel">
          <div className="panel__header"><span className="panel__title">Least Selling Products</span></div>
          <ProductMiniList products={products.leastSelling} metric="sold" emptyMessage="No sales recorded yet" />
        </div>
        <div className="card panel">
          <div className="panel__header"><span className="panel__title">Low Stock Alerts</span></div>
          <StockAlertList products={inventoryAlerts.lowStock} type="low" />
        </div>
      </div>

      {/* ---------- Recent Orders / Sales ---------- */}
      <div className="dashboard-tables-grid">
        <div className="card panel">
          <div className="panel__header"><span className="panel__title">Recent Online Orders</span></div>
          <RecentOrdersTable orders={recent.orders} />
        </div>
        <div className="card panel">
          <div className="panel__header"><span className="panel__title">Recent Offline Sales</span></div>
          <RecentSalesTable sales={recent.sales} />
        </div>
      </div>

      <div className="dashboard-tables-grid" style={{ marginTop: 'var(--space-5)' }}>
        <div className="card panel">
          <div className="panel__header"><span className="panel__title">Out of Stock Alerts</span></div>
          <StockAlertList products={inventoryAlerts.outOfStock} type="out" />
        </div>
        <div className="card panel">
          <div className="panel__header"><span className="panel__title">Recent Notifications</span></div>
          <RecentNotifications notifications={recent.notifications} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
