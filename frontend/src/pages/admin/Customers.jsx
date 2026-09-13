import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { FiRefreshCw } from 'react-icons/fi';

import { customerApi } from '../../services/customerApi';
import useDebounce from '../../hooks/useDebounce';

import CustomerStats from '../../components/admin/customers/CustomerStats';
import CustomerFilters from '../../components/admin/customers/CustomerFilters';
import CustomerTable from '../../components/admin/customers/CustomerTable';
import CustomerBlockModal from '../../components/admin/customers/CustomerBlockModal';

const DEFAULT_FILTERS = {
  search: '',
  department: '',
  status: '',
  purchaseType: 'all',
  from: '',
  to: '',
  sortBy: 'createdAt',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
};

const Customers = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 350);

  const [summary, setSummary] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState(null);

  // Block / Unblock Modal State
  const [blockModalState, setBlockModalState] = useState({
    open: false,
    customer: null,
    action: 'block',
    loading: false,
  });

  // Fetch summary cards
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await customerApi.getCustomerSummary();
      setSummary(res.data);
    } catch (err) {
      console.error('Failed to load customer summary:', err);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // Fetch customers list
  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const query = {
        ...filters,
        search: debouncedSearch,
      };
      const res = await customerApi.getCustomers(query);
      setCustomers(res.data.customers || []);
      setDepartments(res.data.departments || []);
      setPagination(res.meta || {});
    } catch (err) {
      setError(err.message || 'Unable to load customers.');
      toast.error(err.message || 'Unable to load customers.');
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Open Block / Unblock Modal
  const handleOpenBlockModal = (customer, action = 'block') => {
    setBlockModalState({
      open: true,
      customer,
      action,
      loading: false,
    });
  };

  // Confirm Block / Unblock
  const handleConfirmStatusChange = async (customer, newStatus, reason) => {
    setBlockModalState((prev) => ({ ...prev, loading: true }));
    try {
      await customerApi.updateCustomerStatus(customer._id, newStatus, reason);
      const isBlocked = newStatus === 'blocked';
      toast.success(
        isBlocked
          ? `Customer "${customer.name}" blocked successfully.`
          : `Customer "${customer.name}" unblocked successfully.`
      );
      setBlockModalState({ open: false, customer: null, action: 'block', loading: false });
      fetchCustomers();
      fetchSummary();
    } catch (err) {
      toast.error(err.message || 'Failed to update customer status.');
      setBlockModalState((prev) => ({ ...prev, loading: false }));
    }
  };

  // Reset all filters to default
  const handleResetFilters = () => {
    setFilters(DEFAULT_FILTERS);
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1
          style={{
            fontSize: 'var(--font-size-2xl)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            margin: '0 0 4px 0',
          }}
        >
          Customers
        </h1>
        <p style={{ color: 'var(--color-text-muted)', margin: 0, fontSize: 'var(--font-size-sm)' }}>
          Manage students, customer information, orders and purchase history.
        </p>
      </div>

      {/* Top 5 Summary Cards */}
      {summaryLoading ? (
        <div
          className="dashboard-stats-grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card stat-card">
              <Skeleton circle width={46} height={46} />
              <div style={{ flex: 1 }}>
                <Skeleton width={80} height={12} style={{ marginBottom: 6 }} />
                <Skeleton width={110} height={24} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        summary && <CustomerStats summary={summary} />
      )}

      {/* Main Customers Panel */}
      <div className="card panel" style={{ marginTop: 'var(--space-6)' }}>
        <div className="panel__header">
          <div className="flex items-center gap-2">
            <span className="panel__title">Customer Directory</span>
            {pagination?.total !== undefined && (
              <span
                style={{
                  fontSize: 'var(--font-size-xs)',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-bg)',
                  padding: '2px 8px',
                  borderRadius: 'var(--radius-full)',
                }}
              >
                {pagination.total} registered student{pagination.total !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <button
            type="button"
            className="btn btn--ghost btn--sm btn--icon"
            onClick={() => {
              fetchSummary();
              fetchCustomers();
            }}
            title="Refresh"
            aria-label="Refresh list"
          >
            <FiRefreshCw size={15} />
          </button>
        </div>

        {/* Filter Controls */}
        <CustomerFilters
          filters={filters}
          departments={departments}
          onChange={setFilters}
          onReset={handleResetFilters}
        />

        {/* Loading / Error / Table Content */}
        {loading ? (
          <div>
            <Skeleton height={42} count={6} style={{ marginBottom: 8, borderRadius: 6 }} />
          </div>
        ) : error ? (
          <div
            className="empty-state"
            style={{
              padding: 'var(--space-8) 0',
              textAlign: 'center',
            }}
          >
            <div style={{ color: 'var(--color-danger)', marginBottom: 'var(--space-3)' }}>
              {error}
            </div>
            <button
              type="button"
              className="btn btn--outline btn--sm"
              onClick={fetchCustomers}
            >
              Retry
            </button>
          </div>
        ) : (
          <CustomerTable
            customers={customers}
            pagination={pagination}
            onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            onOpenBlockModal={handleOpenBlockModal}
          />
        )}
      </div>

      {/* Block / Unblock Modal */}
      <CustomerBlockModal
        open={blockModalState.open}
        customer={blockModalState.customer}
        action={blockModalState.action}
        loading={blockModalState.loading}
        onClose={() =>
          setBlockModalState({ open: false, customer: null, action: 'block', loading: false })
        }
        onConfirm={handleConfirmStatusChange}
      />
    </div>
  );
};

export default Customers;
