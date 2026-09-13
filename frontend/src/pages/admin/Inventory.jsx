import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

import { inventoryApi } from '../../services/inventoryApi';
import { categoryApi } from '../../services/categoryApi';
import useDebounce from '../../hooks/useDebounce';

import Pagination from '../../components/common/Pagination';
import InventoryValueCards from '../../components/admin/inventory/InventoryValueCards';
import InventoryValueByCategory from '../../components/admin/inventory/InventoryValueByCategory';
import StockLevelsFilters from '../../components/admin/inventory/StockLevelsFilters';
import StockLevelsTable from '../../components/admin/inventory/StockLevelsTable';
import StockHistoryFilters from '../../components/admin/inventory/StockHistoryFilters';
import StockHistoryTable from '../../components/admin/inventory/StockHistoryTable';
import RestockModal from '../../components/admin/inventory/RestockModal';
import AdjustStockModal from '../../components/admin/inventory/AdjustStockModal';

const DEFAULT_STOCK_FILTERS = { search: '', category: '', availability: '', page: 1 };
const DEFAULT_HISTORY_FILTERS = { type: '', from: '', to: '', page: 1 };

const Inventory = () => {
  const [tab, setTab] = useState('levels');

  const [report, setReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(true);

  const [categories, setCategories] = useState([]);

  const [stockFilters, setStockFilters] = useState(DEFAULT_STOCK_FILTERS);
  const debouncedSearch = useDebounce(stockFilters.search, 400);
  const [products, setProducts] = useState([]);
  const [productsMeta, setProductsMeta] = useState(null);
  const [productsLoading, setProductsLoading] = useState(true);

  const [historyFilters, setHistoryFilters] = useState(DEFAULT_HISTORY_FILTERS);
  const [historyEntries, setHistoryEntries] = useState([]);
  const [historyMeta, setHistoryMeta] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [restockTarget, setRestockTarget] = useState(null);
  const [adjustTarget, setAdjustTarget] = useState(null);

  const fetchReport = useCallback(async () => {
    setReportLoading(true);
    try {
      const res = await inventoryApi.getValueReport();
      setReport(res.data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setReportLoading(false);
    }
  }, []);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryApi.list();
      setCategories(res.data.categories);
    } catch (err) {
      toast.error(err.message);
    }
  }, []);

  const fetchStockLevels = useCallback(async () => {
    setProductsLoading(true);
    try {
      const res = await inventoryApi.getStockLevels({ ...stockFilters, search: debouncedSearch });
      setProducts(res.data.products);
      setProductsMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setProductsLoading(false);
    }
  }, [stockFilters, debouncedSearch]);

  const fetchHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await inventoryApi.getHistory(historyFilters);
      setHistoryEntries(res.data.entries);
      setHistoryMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyFilters]);

  useEffect(() => {
    fetchReport();
    fetchCategories();
  }, [fetchReport, fetchCategories]);

  useEffect(() => {
    if (tab === 'levels') fetchStockLevels();
  }, [tab, fetchStockLevels]);

  useEffect(() => {
    if (tab === 'history') fetchHistory();
  }, [tab, fetchHistory]);

  const refreshAfterStockChange = () => {
    fetchStockLevels();
    fetchReport();
    if (tab === 'history') fetchHistory();
  };

  return (
    <div>
      {reportLoading ? (
        <div className="dashboard-stats-grid">
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="card" key={i} style={{ padding: 'var(--space-5)' }}>
              <Skeleton height={46} width={46} borderRadius={10} />
              <Skeleton height={14} width={100} style={{ marginTop: 12 }} />
              <Skeleton height={24} width={70} />
            </div>
          ))}
        </div>
      ) : (
        <InventoryValueCards report={report} />
      )}

      <div className="dashboard-charts-grid" style={{ gridTemplateColumns: '1fr' }}>
        <div className="card panel">
          <div className="panel__header">
            <span className="panel__title">Inventory Value by Category</span>
          </div>
          {reportLoading ? <Skeleton height={140} /> : <InventoryValueByCategory byCategory={report?.byCategory || []} />}
        </div>
      </div>

      <div className="auth-role-toggle" style={{ width: 280, marginBottom: 'var(--space-5)' }}>
        <a className={tab === 'levels' ? 'active' : ''} onClick={() => setTab('levels')} style={{ cursor: 'pointer' }}>
          Stock Levels
        </a>
        <a className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')} style={{ cursor: 'pointer' }}>
          Stock History
        </a>
      </div>

      {tab === 'levels' ? (
        <div className="card panel">
          <StockLevelsFilters filters={stockFilters} onChange={setStockFilters} categories={categories} />
          {productsLoading ? (
            <Skeleton height={48} count={6} style={{ marginBottom: 8 }} />
          ) : (
            <>
              <StockLevelsTable
                products={products}
                onRestock={setRestockTarget}
                onAdjust={setAdjustTarget}
              />
              <Pagination meta={productsMeta} onPageChange={(page) => setStockFilters((f) => ({ ...f, page }))} />
            </>
          )}
        </div>
      ) : (
        <div className="card panel">
          <StockHistoryFilters filters={historyFilters} onChange={setHistoryFilters} />
          {historyLoading ? (
            <Skeleton height={48} count={6} style={{ marginBottom: 8 }} />
          ) : (
            <>
              <StockHistoryTable entries={historyEntries} />
              <Pagination meta={historyMeta} onPageChange={(page) => setHistoryFilters((f) => ({ ...f, page }))} />
            </>
          )}
        </div>
      )}

      <RestockModal
        open={!!restockTarget}
        onClose={() => setRestockTarget(null)}
        product={restockTarget}
        onSaved={refreshAfterStockChange}
      />
      <AdjustStockModal
        open={!!adjustTarget}
        onClose={() => setAdjustTarget(null)}
        product={adjustTarget}
        onSaved={refreshAfterStockChange}
      />
    </div>
  );
};

export default Inventory;
