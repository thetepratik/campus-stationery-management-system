import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

import { saleApi } from '../../services/saleApi';
import useDebounce from '../../hooks/useDebounce';
import { formatCurrency } from '../../utils/formatCurrency';

import Pagination from '../../components/common/Pagination';
import StatCard from '../../components/admin/dashboard/StatCard';
import SalesHistoryFilters from '../../components/admin/sales/SalesHistoryFilters';
import SalesHistoryTable from '../../components/admin/sales/SalesHistoryTable';
import ReceiptModal from '../../components/admin/sales/ReceiptModal';
import { FiShoppingBag, FiDollarSign } from 'react-icons/fi';

const DEFAULT_FILTERS = { search: '', paymentMethod: '', from: '', to: '', page: 1 };

const SalesHistory = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);

  const [sales, setSales] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewingSale, setViewingSale] = useState(null);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const res = await saleApi.list({ ...filters, search: debouncedSearch });
      setSales(res.data.sales);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleView = async (sale) => {
    try {
      const res = await saleApi.get(sale._id);
      setViewingSale(res.data.sale);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <StatCard icon={FiShoppingBag} label="Sales (this view)" value={meta?.totalCount ?? '—'} color="primary" />
        <StatCard icon={FiDollarSign} label="Revenue (this view)" value={formatCurrency(meta?.totalRevenue)} color="secondary" />
      </div>

      <div className="card panel">
        <div className="panel__header">
          <span className="panel__title">Sales History</span>
        </div>
        <SalesHistoryFilters filters={filters} onChange={setFilters} />
        {loading ? (
          <Skeleton height={48} count={6} style={{ marginBottom: 8 }} />
        ) : (
          <>
            <SalesHistoryTable sales={sales} onView={handleView} />
            <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </div>

      <ReceiptModal open={!!viewingSale} onClose={() => setViewingSale(null)} sale={viewingSale} />
    </div>
  );
};

export default SalesHistory;
