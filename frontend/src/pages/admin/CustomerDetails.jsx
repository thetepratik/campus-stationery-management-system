import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiBook,
  FiCalendar,
  FiShoppingBag,
  FiPackage,
  FiDollarSign,
  FiSlash,
  FiCheckCircle,
  FiTrendingUp,
  FiClock,
} from 'react-icons/fi';

import { customerApi } from '../../services/customerApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate, formatDateTime } from '../../utils/formatDate';

import CustomerPurchaseHistory from '../../components/admin/customers/CustomerPurchaseHistory';
import CustomerSpendingChart from '../../components/admin/customers/CustomerSpendingChart';
import CustomerBlockModal from '../../components/admin/customers/CustomerBlockModal';
import Pagination from '../../components/common/Pagination';

const CustomerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [customer, setCustomer] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [purchasesData, setPurchasesData] = useState({ purchases: [], counts: {}, pagination: {} });
  const [purchaseTypeFilter, setPurchaseTypeFilter] = useState('all');
  const [purchasesPage, setPurchasesPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [purchasesLoading, setPurchasesLoading] = useState(true);
  const [error, setError] = useState(null);

  // Block Modal
  const [blockModalState, setBlockModalState] = useState({
    open: false,
    action: 'block',
    loading: false,
  });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/customers');
    }
  };

  // Fetch customer profile & statistics
  const fetchCustomerInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [custRes, statsRes] = await Promise.all([
        customerApi.getCustomerById(id),
        customerApi.getCustomerStatistics(id),
      ]);
      setCustomer(custRes.data.customer);
      setStatistics(statsRes.data);
    } catch (err) {
      setError(err.message || 'Unable to load customer profile.');
      toast.error(err.message || 'Unable to load customer profile.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Fetch purchase history
  const fetchPurchases = useCallback(async () => {
    setPurchasesLoading(true);
    try {
      const res = await customerApi.getCustomerPurchases(id, {
        page: purchasesPage,
        limit: 10,
        type: purchaseTypeFilter,
      });
      setPurchasesData({
        purchases: res.data.purchases || [],
        counts: res.data.counts || {},
        pagination: res.meta || {},
      });
    } catch (err) {
      toast.error(err.message || 'Unable to load purchases.');
    } finally {
      setPurchasesLoading(false);
    }
  }, [id, purchasesPage, purchaseTypeFilter]);

  useEffect(() => {
    fetchCustomerInfo();
  }, [fetchCustomerInfo]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  // Handle Block / Unblock action
  const handleConfirmStatusChange = async (targetCustomer, newStatus, reason) => {
    setBlockModalState((prev) => ({ ...prev, loading: true }));
    try {
      await customerApi.updateCustomerStatus(id, newStatus, reason);
      const isBlocked = newStatus === 'blocked';
      toast.success(
        isBlocked ? 'Customer blocked successfully.' : 'Customer unblocked successfully.'
      );
      setBlockModalState({ open: false, action: 'block', loading: false });
      fetchCustomerInfo();
    } catch (err) {
      toast.error(err.message || 'Failed to update customer status.');
      setBlockModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  if (loading) {
    return (
      <div>
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <Skeleton width={160} height={32} />
        </div>
        <div className="card panel" style={{ marginBottom: 'var(--space-5)' }}>
          <Skeleton height={120} />
        </div>
        <div className="dashboard-stats-grid">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card stat-card">
              <Skeleton circle width={40} height={40} />
              <div style={{ flex: 1 }}>
                <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width={100} height={20} />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="card panel" style={{ textAlign: 'center', padding: 'var(--space-10) 0' }}>
        <h3 style={{ color: 'var(--color-danger)' }}>{error || 'Customer not found'}</h3>
        <button
          type="button"
          className="btn btn--primary btn--sm"
          style={{ marginTop: 'var(--space-3)' }}
          onClick={handleBack}
        >
          Back to Customers
        </button>
      </div>
    );
  }

  const isBlocked = (customer.status || 'active') === 'blocked';
  const initials = (customer.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const paginationMeta = {
    page: purchasesData.pagination.page || 1,
    limit: purchasesData.pagination.limit || 10,
    totalCount: purchasesData.pagination.total || 0,
    totalPages: purchasesData.pagination.totalPages || 1,
    hasPrevPage: (purchasesData.pagination.page || 1) > 1,
    hasNextPage:
      (purchasesData.pagination.page || 1) < (purchasesData.pagination.totalPages || 1),
  };

  return (
    <div>
      {/* Back Button & Top Action Row */}
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: 'var(--space-5)', flexWrap: 'wrap', gap: 'var(--space-3)' }}
      >
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <FiArrowLeft size={16} /> Back to Customers
        </button>

        <div className="flex items-center gap-3">
          <span
            className={`badge ${isBlocked ? 'badge--outofstock' : 'badge--instock'}`}
            style={{ fontSize: '0.8rem', padding: '4px 10px', textTransform: 'capitalize' }}
          >
            Status: {customer.status || 'active'}
          </span>

          {isBlocked ? (
            <button
              type="button"
              className="btn btn--outline btn--sm"
              style={{
                color: '#10B981',
                borderColor: '#10B981',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
              }}
              onClick={() => setBlockModalState({ open: true, action: 'unblock', loading: false })}
            >
              <FiCheckCircle size={15} /> Unblock Customer
            </button>
          ) : (
            <button
              type="button"
              className="btn btn--danger btn--sm"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => setBlockModalState({ open: true, action: 'block', loading: false })}
            >
              <FiSlash size={15} /> Block Customer
            </button>
          )}
        </div>
      </div>

      {/* Profile Card */}
      <div className="card panel" style={{ marginBottom: 'var(--space-6)' }}>
        <div
          className="flex items-start gap-4"
          style={{ flexWrap: 'wrap', alignItems: 'center' }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: isBlocked ? 'var(--color-danger)' : 'var(--color-primary)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            {initials}
          </div>

          {/* Core Info */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
              <h2 style={{ margin: 0, fontSize: 'var(--font-size-xl)', fontWeight: 700 }}>
                {customer.name}
              </h2>
              {customer.isVerified && (
                <span
                  className="badge badge--instock"
                  style={{ fontSize: '0.7rem', padding: '2px 6px' }}
                >
                  Verified
                </span>
              )}
            </div>

            <div
              className="flex items-center gap-4"
              style={{
                flexWrap: 'wrap',
                marginTop: 6,
                fontSize: 'var(--font-size-sm)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <FiBook size={14} /> <strong>Roll No:</strong> {customer.rollNumber || '—'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <strong>Dept:</strong> {customer.department || '—'}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <FiMail size={14} /> {customer.email}
              </span>
              {customer.mobile && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <FiPhone size={14} /> {customer.mobile}
                </span>
              )}
            </div>
          </div>

          {/* Registration Date Meta */}
          <div
            style={{
              textAlign: 'right',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-muted)',
              borderLeft: '1px solid var(--color-border)',
              paddingLeft: 'var(--space-4)',
            }}
          >
            <div>Registered:</div>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {formatDate(customer.createdAt)}
            </strong>
            <div style={{ marginTop: 6 }}>Last Purchase:</div>
            <strong style={{ color: 'var(--color-text-primary)' }}>
              {statistics?.lastPurchase ? formatDate(statistics.lastPurchase) : 'No purchases yet'}
            </strong>
          </div>
        </div>
      </div>

      {/* Customer Summary Statistics Cards */}
      {statistics && (
        <div
          className="dashboard-stats-grid"
          style={{
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            marginBottom: 'var(--space-6)',
          }}
        >
          {/* Total Orders */}
          <div className="card stat-card">
            <div
              className="stat-card__icon"
              style={{ background: 'rgba(79, 70, 229, 0.12)', color: '#4F46E5' }}
            >
              <FiShoppingBag size={20} />
            </div>
            <div>
              <div className="stat-card__label">Total Orders</div>
              <div className="stat-card__value">{statistics.totalOrders || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                {statistics.onlineOrdersCount || 0} Online •{' '}
                {statistics.offlinePurchasesCount || 0} Offline
              </div>
            </div>
          </div>

          {/* Items Purchased */}
          <div className="card stat-card">
            <div
              className="stat-card__icon"
              style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10B981' }}
            >
              <FiPackage size={20} />
            </div>
            <div>
              <div className="stat-card__label">Items Purchased</div>
              <div className="stat-card__value">{statistics.totalItemsPurchased || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Total stationery units
              </div>
            </div>
          </div>

          {/* Total Spent */}
          <div className="card stat-card">
            <div
              className="stat-card__icon"
              style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#8B5CF6' }}
            >
              <FiDollarSign size={20} />
            </div>
            <div>
              <div className="stat-card__label">Total Spent</div>
              <div className="stat-card__value">{formatCurrency(statistics.totalSpent || 0)}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Historical purchases
              </div>
            </div>
          </div>

          {/* Average Order Value */}
          <div className="card stat-card">
            <div
              className="stat-card__icon"
              style={{ background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B' }}
            >
              <FiTrendingUp size={20} />
            </div>
            <div>
              <div className="stat-card__label">Average Order Value</div>
              <div className="stat-card__value">
                {formatCurrency(statistics.averageOrderValue || 0)}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Per purchase transaction
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Row: Most Purchased Products & Monthly Spending Chart */}
      {statistics && (
        <div
          className="dashboard-charts-grid"
          style={{ gridTemplateColumns: '1.2fr 1fr', marginBottom: 'var(--space-6)' }}
        >
          {/* Monthly Spending Chart */}
          <div className="card panel">
            <div className="panel__header">
              <span className="panel__title">Monthly Spending Trend</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Last 6 Months
              </span>
            </div>
            <CustomerSpendingChart monthlySpending={statistics.monthlySpending || []} />
          </div>

          {/* Most Purchased Products */}
          <div className="card panel">
            <div className="panel__header">
              <span className="panel__title">Most Purchased Products</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                Top Items
              </span>
            </div>
            {!statistics.mostPurchasedProducts?.length ? (
              <div
                style={{
                  height: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--color-text-muted)',
                  fontSize: 'var(--font-size-sm)',
                }}
              >
                No purchase items recorded
              </div>
            ) : (
              <div>
                {statistics.mostPurchasedProducts.map((prod, idx) => {
                  const maxQty = statistics.mostPurchasedProducts[0]?.quantity || 1;
                  const percent = Math.round((prod.quantity / maxQty) * 100);

                  return (
                    <div
                      key={idx}
                      style={{
                        marginBottom: 'var(--space-3)',
                        paddingBottom: 'var(--space-2)',
                        borderBottom:
                          idx < statistics.mostPurchasedProducts.length - 1
                            ? '1px solid var(--color-border)'
                            : 'none',
                      }}
                    >
                      <div
                        className="flex items-center justify-between"
                        style={{ fontSize: 'var(--font-size-sm)', marginBottom: 4 }}
                      >
                        <span style={{ fontWeight: 500 }}>{prod.name}</span>
                        <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>
                          {prod.quantity} unit{prod.quantity !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 6,
                          width: '100%',
                          background: 'var(--color-bg)',
                          borderRadius: 3,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${percent}%`,
                            background: 'var(--color-primary)',
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete Purchase History Section */}
      <div className="card panel">
        <div className="panel__header">
          <div>
            <span className="panel__title">Purchase History</span>
            <p
              style={{
                margin: '2px 0 0',
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-muted)',
              }}
            >
              Complete history of online orders and offline desk sales linked to this customer.
            </p>
          </div>
        </div>

        {purchasesLoading ? (
          <div>
            <Skeleton height={42} count={4} style={{ marginBottom: 8 }} />
          </div>
        ) : (
          <>
            <CustomerPurchaseHistory
              purchases={purchasesData.purchases}
              counts={purchasesData.counts}
              activeType={purchaseTypeFilter}
              onTypeChange={(type) => {
                setPurchaseTypeFilter(type);
                setPurchasesPage(1);
              }}
            />
            <Pagination
              meta={paginationMeta}
              onPageChange={(page) => setPurchasesPage(page)}
            />
          </>
        )}
      </div>

      {/* Block / Unblock Confirmation Modal */}
      <CustomerBlockModal
        open={blockModalState.open}
        customer={customer}
        action={blockModalState.action}
        loading={blockModalState.loading}
        onClose={() => setBlockModalState({ open: false, action: 'block', loading: false })}
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
};

export default CustomerDetails;
