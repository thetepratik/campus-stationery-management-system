import { useEffect, useState, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import {
  FiFileText,
  FiDownload,
  FiPrinter,
  FiRefreshCw,
  FiCalendar,
  FiDollarSign,
  FiShoppingBag,
  FiGlobe,
  FiBox,
  FiPercent,
  FiSearch,
  FiFilter,
  FiTrendingUp,
  FiCheckCircle,
  FiAlertCircle,
  FiRotateCcw,
  FiLayers,
  FiCreditCard,
  FiArrowUp,
  FiArrowDown,
} from 'react-icons/fi';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';

import { reportApi } from '../../services/reportApi';
import { formatCurrency } from '../../utils/formatCurrency';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/admin/dashboard/StatCard';
import Pagination from '../../components/common/Pagination';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler
);

const QUICK_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'yesterday', label: 'Yesterday' },
  { id: 'this_week', label: 'This Week' },
  { id: 'last_week', label: 'Last Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'last_month', label: 'Last Month' },
  { id: 'this_year', label: 'This Year' },
  { id: 'custom', label: 'Custom Range' },
];

const PAYMENT_PALETTE = ['#4F46E5', '#22C55E', '#0EA5E9', '#F59E0B', '#EC4899', '#8B5CF6', '#14B8A6', '#64748B'];

const getQuickRangeDates = (filterId) => {
  const now = new Date();
  let from = new Date(now);
  let to = new Date(now);

  switch (filterId) {
    case 'today':
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    case 'yesterday':
      from.setDate(now.getDate() - 1);
      from.setHours(0, 0, 0, 0);
      to.setDate(now.getDate() - 1);
      to.setHours(23, 59, 59, 999);
      break;
    case 'this_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday start
      from.setDate(diff);
      from.setHours(0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    }
    case 'last_week': {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1) - 7;
      from.setDate(diff);
      from.setHours(0, 0, 0, 0);
      to = new Date(from);
      to.setDate(from.getDate() + 6);
      to.setHours(23, 59, 59, 999);
      break;
    }
    case 'this_month':
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    case 'last_month':
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      break;
    case 'this_year':
      from = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
    default:
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      to.setHours(23, 59, 59, 999);
      break;
  }

  const toInputString = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const date = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${date}`;
  };

  return {
    fromDate: toInputString(from),
    toDate: toInputString(to),
  };
};

const SalesReport = () => {
  const { user } = useAuth();

  // Active quick filter preset
  const [activeQuickFilter, setActiveQuickFilter] = useState('this_month');

  // Date filters
  const defaultDates = useMemo(() => getQuickRangeDates('this_month'), []);
  const [fromDate, setFromDate] = useState(defaultDates.fromDate);
  const [toDate, setToDate] = useState(defaultDates.toDate);

  // Table filters, search, pagination & sorting
  const [search, setSearch] = useState('');
  const [saleTypeFilter, setSaleTypeFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);

  // View state & metrics toggles
  const [trendMetric, setTrendMetric] = useState('revenue'); // 'revenue' | 'sales'
  const [topSortMetric, setTopSortMetric] = useState('quantity'); // 'quantity' | 'revenue'

  // Loading & export states
  const [loading, setLoading] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [meta, setMeta] = useState(null);

  // Date validation
  const dateError = useMemo(() => {
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      return 'From Date cannot be after To Date.';
    }
    return null;
  }, [fromDate, toDate]);

  // Fetch report data
  const fetchReport = useCallback(async (pageOverride) => {
    if (dateError) return;

    setLoading(true);
    try {
      const pageToFetch = pageOverride !== undefined ? pageOverride : currentPage;
      const res = await reportApi.getSalesReport({
        fromDate,
        toDate,
        search: search.trim() || undefined,
        saleType: saleTypeFilter !== 'all' ? saleTypeFilter : undefined,
        paymentMethod: paymentMethodFilter || undefined,
        paymentStatus: paymentStatusFilter || undefined,
        sortBy,
        sortOrder,
        page: pageToFetch,
        limit: 15,
      });

      setReportData(res.data);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message || 'Unable to generate sales report. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate, search, saleTypeFilter, paymentMethodFilter, paymentStatusFilter, sortBy, sortOrder, currentPage, dateError]);

  // Initial load
  useEffect(() => {
    fetchReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromDate, toDate, saleTypeFilter, paymentMethodFilter, paymentStatusFilter, sortBy, sortOrder]);

  // Handle quick date filter button click
  const handleQuickFilterClick = (filterId) => {
    setActiveQuickFilter(filterId);
    if (filterId !== 'custom') {
      const { fromDate: newFrom, toDate: newTo } = getQuickRangeDates(filterId);
      setFromDate(newFrom);
      setToDate(newTo);
      setCurrentPage(1);
    }
  };

  // Handle custom date change
  const handleDateChange = (type, val) => {
    setActiveQuickFilter('custom');
    if (type === 'from') setFromDate(val);
    if (type === 'to') setToDate(val);
    setCurrentPage(1);
  };

  // Handle Search submit
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchReport(1);
  };

  // Handle Pagination change
  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    fetchReport(newPage);
  };

  // Export PDF
  const handleExportPdf = async () => {
    if (dateError) return;
    setExportingPdf(true);
    try {
      await reportApi.exportPdf({
        fromDate,
        toDate,
        saleType: saleTypeFilter !== 'all' ? saleTypeFilter : undefined,
        paymentMethod: paymentMethodFilter || undefined,
        search: search.trim() || undefined,
      });
      toast.success('PDF report downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to export PDF');
    } finally {
      setExportingPdf(false);
    }
  };

  // Export Excel
  const handleExportExcel = async () => {
    if (dateError) return;
    setExportingExcel(true);
    try {
      await reportApi.exportExcel({
        fromDate,
        toDate,
        saleType: saleTypeFilter !== 'all' ? saleTypeFilter : undefined,
        paymentMethod: paymentMethodFilter || undefined,
        search: search.trim() || undefined,
      });
      toast.success('Excel report downloaded successfully');
    } catch (err) {
      toast.error(err.message || 'Failed to export Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  // Print report
  const handlePrint = () => {
    window.print();
  };

  const summary = reportData?.summary || {
    totalRevenue: 0,
    totalSales: 0,
    totalItemsSold: 0,
    averageOrderValue: 0,
    offlineSales: 0,
    onlineSales: 0,
    refunds: 0,
    netRevenue: 0,
  };

  const salesTrend = reportData?.salesTrend || [];
  const paymentMethods = reportData?.paymentMethods || [];
  const categories = reportData?.categories || [];
  const topProducts = reportData?.topProducts || [];
  const leastProducts = reportData?.leastProducts || [];
  const transactions = reportData?.transactions || [];

  // Sort top products based on selected metric
  const sortedTopProducts = useMemo(() => {
    return [...topProducts].sort((a, b) =>
      topSortMetric === 'revenue' ? b.revenue - a.revenue : b.quantitySold - a.quantitySold
    );
  }, [topProducts, topSortMetric]);

  // Sales Trend Chart configuration
  const trendChartData = useMemo(() => {
    const labels = salesTrend.map((t) => t.displayDate);
    const dataPoints = salesTrend.map((t) => (trendMetric === 'revenue' ? t.revenue : t.sales));

    return {
      labels,
      datasets: [
        {
          label: trendMetric === 'revenue' ? 'Revenue (₹)' : 'Transactions',
          data: dataPoints,
          borderColor: '#4F46E5',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          fill: true,
          tension: 0.35,
          pointRadius: salesTrend.length > 20 ? 0 : 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#4F46E5',
          borderWidth: 2.5,
        },
      ],
    };
  }, [salesTrend, trendMetric]);

  const trendChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#0F172A',
        titleFont: { size: 12, weight: 'bold' },
        bodyFont: { size: 12 },
        padding: 10,
        cornerRadius: 8,
        callbacks: {
          label: (ctx) =>
            trendMetric === 'revenue' ? ` Revenue: ₹${ctx.parsed.y.toLocaleString('en-IN')}` : ` Transactions: ${ctx.parsed.y}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { maxTicksLimit: 12, font: { size: 11 } },
      },
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.15)' },
        ticks: {
          font: { size: 11 },
          callback: (val) => (trendMetric === 'revenue' ? `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}` : val),
        },
      },
    },
  };

  // Payment Methods Doughnut Chart configuration
  const paymentChartData = useMemo(() => {
    return {
      labels: paymentMethods.map((p) => p.method),
      datasets: [
        {
          data: paymentMethods.map((p) => p.revenue),
          backgroundColor: PAYMENT_PALETTE.slice(0, paymentMethods.length),
          borderWidth: 0,
        },
      ],
    };
  }, [paymentMethods]);

  const paymentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: { boxWidth: 10, font: { size: 11 }, padding: 12 },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ₹${ctx.parsed.toLocaleString('en-IN')} (${paymentMethods[ctx.dataIndex]?.percentage}%)`,
        },
      },
    },
    cutout: '65%',
  };

  return (
    <div className="sales-report-page" style={{ paddingBottom: 'var(--space-12)' }}>
      {/* ============================================================
          HEADER & TOP-RIGHT ACTIONS
          ============================================================ */}
      <div
        className="flex items-center justify-between no-print"
        style={{
          marginBottom: 'var(--space-6)',
          flexWrap: 'wrap',
          gap: 'var(--space-4)',
        }}
      >
        <div>
          <h1 style={{ fontSize: 'var(--font-size-2xl)', fontWeight: 'var(--font-weight-bold)' }}>Sales Report</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)', marginTop: 4 }}>
            Analyze sales performance, revenue, products and payment methods.
          </p>
        </div>

        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <button
            className="btn btn--primary"
            onClick={() => {
              setCurrentPage(1);
              fetchReport(1);
            }}
            disabled={loading || Boolean(dateError)}
            title="Generate sales report for selected period"
          >
            <FiRefreshCw className={loading ? 'spin' : ''} size={16} />
            <span>{loading ? 'Generating...' : 'Generate Report'}</span>
          </button>

          <button
            className="btn btn--outline"
            onClick={handleExportPdf}
            disabled={loading || exportingPdf || summary.totalSales === 0 || Boolean(dateError)}
            title="Export report as PDF"
          >
            <FiDownload size={16} />
            <span>{exportingPdf ? 'Exporting...' : 'Export PDF'}</span>
          </button>

          <button
            className="btn btn--outline"
            onClick={handleExportExcel}
            disabled={loading || exportingExcel || summary.totalSales === 0 || Boolean(dateError)}
            title="Export report as Excel spreadsheet"
          >
            <FiFileText size={16} />
            <span>{exportingExcel ? 'Exporting...' : 'Export Excel'}</span>
          </button>

          <button
            className="btn btn--outline"
            onClick={handlePrint}
            disabled={loading || summary.totalSales === 0}
            title="Print report"
          >
            <FiPrinter size={16} />
            <span>Print</span>
          </button>
        </div>
      </div>

      {/* ============================================================
          DATE FILTER SECTION
          ============================================================ */}
      <div
        className="card no-print"
        style={{
          padding: 'var(--space-4) var(--space-5)',
          marginBottom: 'var(--space-6)',
        }}
      >
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-4)' }}>
          {/* Quick Date Range Pills */}
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <span style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-muted)', textTransform: 'uppercase', marginRight: 4 }}>
              Quick Range:
            </span>
            {QUICK_FILTERS.map((qf) => (
              <button
                key={qf.id}
                className={`btn btn--sm ${activeQuickFilter === qf.id ? 'btn--primary' : 'btn--outline'}`}
                style={{ borderRadius: 'var(--radius-full)', padding: '0.35rem 0.85rem' }}
                onClick={() => handleQuickFilterClick(qf.id)}
              >
                {qf.label}
              </button>
            ))}
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
            <div className="flex items-center gap-2">
              <label htmlFor="from-date-input" style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                From:
              </label>
              <input
                id="from-date-input"
                type="date"
                className="form-input"
                style={{ padding: '0.4rem 0.65rem', fontSize: 'var(--font-size-xs)' }}
                value={fromDate}
                onChange={(e) => handleDateChange('from', e.target.value)}
              />
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="to-date-input" style={{ fontSize: 'var(--font-size-xs)', fontWeight: '600', color: 'var(--color-text-secondary)' }}>
                To:
              </label>
              <input
                id="to-date-input"
                type="date"
                className="form-input"
                style={{ padding: '0.4rem 0.65rem', fontSize: 'var(--font-size-xs)' }}
                value={toDate}
                onChange={(e) => handleDateChange('to', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Validation Error Message */}
        {dateError && (
          <div
            className="flex items-center gap-2"
            style={{
              marginTop: 'var(--space-3)',
              padding: 'var(--space-2) var(--space-3)',
              background: 'var(--color-danger-light)',
              color: 'var(--color-danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--font-size-xs)',
            }}
          >
            <FiAlertCircle size={15} />
            <span>{dateError}</span>
          </div>
        )}
      </div>

      {/* ============================================================
          MAIN REPORT PRINTABLE CONTAINER
          ============================================================ */}
      <div id="sales-report-print-area">
        {/* Printable Header (Visible during print only) */}
        <div className="print-only" style={{ display: 'none', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #4F46E5', paddingBottom: 10 }}>
            <div>
              <h1 style={{ color: '#4F46E5', fontSize: 24, margin: 0 }}>Campus Stationery</h1>
              <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: 11 }}>Inventory & Sales Management System</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <h2 style={{ fontSize: 18, margin: 0, color: '#0F172A' }}>SALES REPORT</h2>
              <p style={{ margin: '4px 0 0 0', color: '#64748B', fontSize: 10 }}>
                Period: {new Date(fromDate).toLocaleDateString('en-IN')} – {new Date(toDate).toLocaleDateString('en-IN')}
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================
            SUMMARY STAT CARDS (8 Cards)
            ============================================================ */}
        {loading ? (
          <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))' }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div className="card" key={i} style={{ padding: 'var(--space-5)' }}>
                <Skeleton height={42} width={42} borderRadius={10} />
                <Skeleton height={14} width={90} style={{ marginTop: 10 }} />
                <Skeleton height={24} width={80} style={{ marginTop: 4 }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="dashboard-stats-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', marginBottom: 'var(--space-6)' }}>
            <StatCard
              icon={FiDollarSign}
              label="Total Revenue"
              value={formatCurrency(summary.totalRevenue)}
              color="primary"
            />
            <StatCard
              icon={FiShoppingBag}
              label="Total Sales"
              value={summary.totalSales.toLocaleString('en-IN')}
              color="secondary"
            />
            <StatCard
              icon={FiBox}
              label="Items Sold"
              value={summary.totalItemsSold.toLocaleString('en-IN')}
              color="info"
            />
            <StatCard
              icon={FiPercent}
              label="Average Order Value"
              value={formatCurrency(summary.averageOrderValue)}
              color="primary"
            />
            <StatCard
              icon={FiShoppingBag}
              label="Offline Sales"
              value={formatCurrency(summary.offlineSales)}
              color="warning"
            />
            <StatCard
              icon={FiGlobe}
              label="Online Sales"
              value={formatCurrency(summary.onlineSales)}
              color="info"
            />
            <StatCard
              icon={FiRotateCcw}
              label="Refunds"
              value={formatCurrency(summary.refunds)}
              color="danger"
            />
            <StatCard
              icon={FiTrendingUp}
              label="Net Revenue"
              value={formatCurrency(summary.netRevenue)}
              color="secondary"
            />
          </div>
        )}

        {/* ============================================================
            SALES TREND & PAYMENT METHOD CHARTS
            ============================================================ */}
        <div className="dashboard-charts-grid" style={{ marginBottom: 'var(--space-6)' }}>
          {/* Sales Trend Chart */}
          <div className="card panel">
            <div className="panel__header">
              <div className="flex items-center gap-2">
                <FiTrendingUp color="var(--color-primary)" size={18} />
                <span className="panel__title">Sales Trend</span>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  className={`btn btn--sm ${trendMetric === 'revenue' ? 'btn--primary' : 'btn--outline'}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: 'var(--font-size-xs)' }}
                  onClick={() => setTrendMetric('revenue')}
                >
                  Revenue
                </button>
                <button
                  className={`btn btn--sm ${trendMetric === 'sales' ? 'btn--primary' : 'btn--outline'}`}
                  style={{ padding: '0.25rem 0.65rem', fontSize: 'var(--font-size-xs)' }}
                  onClick={() => setTrendMetric('sales')}
                >
                  Sales Count
                </button>
              </div>
            </div>

            {loading ? (
              <Skeleton height={260} />
            ) : salesTrend.length === 0 || summary.totalSales === 0 ? (
              <div className="empty-state" style={{ height: 260 }}>
                <FiAlertCircle size={32} />
                <p>No sales recorded for the selected period.</p>
              </div>
            ) : (
              <div style={{ height: 260 }}>
                <Line data={trendChartData} options={trendChartOptions} />
              </div>
            )}
          </div>

          {/* Payment Method Analysis Chart */}
          <div className="card panel">
            <div className="panel__header">
              <div className="flex items-center gap-2">
                <FiCreditCard color="var(--color-info)" size={18} />
                <span className="panel__title">Payment Method Split</span>
              </div>
            </div>

            {loading ? (
              <Skeleton height={260} />
            ) : paymentMethods.length === 0 ? (
              <div className="empty-state" style={{ height: 260 }}>
                <FiCreditCard size={32} />
                <p>No payment data available.</p>
              </div>
            ) : (
              <div style={{ height: 260 }}>
                <Doughnut data={paymentChartData} options={paymentChartOptions} />
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            PAYMENT METHODS & CATEGORY PERFORMANCE BREAKDOWN
            ============================================================ */}
        <div className="dashboard-charts-grid" style={{ marginBottom: 'var(--space-6)' }}>
          {/* Payment Methods Table */}
          <div className="card panel">
            <div className="panel__header">
              <span className="panel__title">Payment Method Analysis</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {paymentMethods.length} Methods
              </span>
            </div>

            {loading ? (
              <Skeleton count={5} height={32} />
            ) : paymentMethods.length === 0 ? (
              <div className="empty-state">No payment data recorded</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Payment Method</th>
                      <th style={{ textAlign: 'center' }}>Transactions</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                      <th style={{ textAlign: 'right' }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentMethods.map((pm, idx) => (
                      <tr key={pm.method}>
                        <td>
                          <div className="flex items-center gap-2">
                            <div
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: PAYMENT_PALETTE[idx % PAYMENT_PALETTE.length],
                                flexShrink: 0,
                              }}
                            />
                            <span style={{ fontWeight: 500 }}>{pm.method}</span>
                          </div>
                        </td>
                        <td style={{ textAlign: 'center' }}>{pm.transactions}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(pm.revenue)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge badge--confirmed">{pm.percentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Sales by Category Table */}
          <div className="card panel">
            <div className="panel__header">
              <span className="panel__title">Sales by Category</span>
              <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
                {categories.length} Categories
              </span>
            </div>

            {loading ? (
              <Skeleton count={5} height={32} />
            ) : categories.length === 0 ? (
              <div className="empty-state">No category data recorded</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Items Sold</th>
                      <th style={{ textAlign: 'center' }}>Orders</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                      <th style={{ textAlign: 'right' }}>Share</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.category}>
                        <td style={{ fontWeight: 500 }}>{c.category}</td>
                        <td style={{ textAlign: 'center' }}>{c.itemsSold}</td>
                        <td style={{ textAlign: 'center' }}>{c.transactions}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(c.revenue)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <span className="badge badge--completed">{c.percentage}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            TOP & LEAST SELLING PRODUCTS
            ============================================================ */}
        <div className="dashboard-charts-grid" style={{ marginBottom: 'var(--space-6)' }}>
          {/* Top Selling Products */}
          <div className="card panel">
            <div className="panel__header">
              <div className="flex items-center gap-2">
                <FiTrendingUp color="var(--color-secondary)" />
                <span className="panel__title">Top Selling Products</span>
              </div>
              <div className="flex items-center gap-2 no-print">
                <button
                  className={`btn btn--sm ${topSortMetric === 'quantity' ? 'btn--primary' : 'btn--outline'}`}
                  style={{ padding: '0.2rem 0.5rem', fontSize: 'var(--font-size-xs)' }}
                  onClick={() => setTopSortMetric('quantity')}
                >
                  By Quantity
                </button>
                <button
                  className={`btn btn--sm ${topSortMetric === 'revenue' ? 'btn--primary' : 'btn--outline'}`}
                  style={{ padding: '0.2rem 0.5rem', fontSize: 'var(--font-size-xs)' }}
                  onClick={() => setTopSortMetric('revenue')}
                >
                  By Revenue
                </button>
              </div>
            </div>

            {loading ? (
              <Skeleton count={5} height={42} />
            ) : sortedTopProducts.length === 0 ? (
              <div className="empty-state">No sales data available for the selected period.</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Qty Sold</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTopProducts.slice(0, 5).map((p, idx) => (
                      <tr key={p.productId || idx}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: idx === 0 ? 'var(--color-primary-light)' : 'var(--color-bg)',
                              color: idx === 0 ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                              fontWeight: 700,
                              fontSize: 'var(--font-size-xs)',
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--color-bg)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                <FiBox size={14} />
                              </div>
                            )}
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge--confirmed">{p.category}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.quantitySold}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Least Selling Products */}
          <div className="card panel">
            <div className="panel__header">
              <div className="flex items-center gap-2">
                <FiLayers color="var(--color-warning)" />
                <span className="panel__title">Least Selling Products</span>
              </div>
            </div>

            {loading ? (
              <Skeleton count={5} height={42} />
            ) : leastProducts.length === 0 ? (
              <div className="empty-state">No sales data available for the selected period.</div>
            ) : (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}>#</th>
                      <th>Product</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'center' }}>Qty Sold</th>
                      <th style={{ textAlign: 'right' }}>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leastProducts.slice(0, 5).map((p, idx) => (
                      <tr key={p.productId || idx}>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: 22,
                              height: 22,
                              borderRadius: '50%',
                              background: 'var(--color-bg)',
                              color: 'var(--color-text-secondary)',
                              fontWeight: 700,
                              fontSize: 'var(--font-size-xs)',
                            }}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            {p.image ? (
                              <img
                                src={p.image}
                                alt={p.name}
                                style={{ width: 28, height: 28, borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: 'var(--radius-sm)',
                                  background: 'var(--color-bg)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: 'var(--color-text-muted)',
                                }}
                              >
                                <FiBox size={14} />
                              </div>
                            )}
                            <span style={{ fontWeight: 500 }}>{p.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge--pending">{p.category}</span>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }}>{p.quantitySold}</td>
                        <td style={{ textAlign: 'right', fontWeight: 600 }}>
                          {formatCurrency(p.revenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            DETAILED SALES TRANSACTION TABLE WITH SEARCH & FILTERS
            ============================================================ */}
        <div className="card panel" style={{ marginBottom: 'var(--space-6)' }}>
          <div className="panel__header" style={{ flexWrap: 'wrap', gap: 'var(--space-3)' }}>
            <div>
              <span className="panel__title">Sales Transaction Records</span>
              <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 2 }}>
                Detailed breakdown of individual offline sales and online orders
              </p>
            </div>

            {/* Filter controls */}
            <div className="flex items-center gap-2 no-print" style={{ flexWrap: 'wrap' }}>
              {/* Search box */}
              <form onSubmit={handleSearchSubmit} className="flex items-center" style={{ position: 'relative' }}>
                <input
                  type="text"
                  placeholder="Search ID, student, dept, item..."
                  className="form-input"
                  style={{ padding: '0.4rem 0.65rem 0.4rem 2rem', fontSize: 'var(--font-size-xs)', width: 220 }}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <FiSearch
                  size={14}
                  style={{ position: 'absolute', left: 8, color: 'var(--color-text-muted)', pointerEvents: 'none' }}
                />
              </form>

              {/* Sale Type filter */}
              <select
                className="form-select"
                style={{ padding: '0.4rem 0.65rem', fontSize: 'var(--font-size-xs)' }}
                value={saleTypeFilter}
                onChange={(e) => {
                  setSaleTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Types</option>
                <option value="offline">Offline Sales</option>
                <option value="online">Online Orders</option>
              </select>

              {/* Payment Method filter */}
              <select
                className="form-select"
                style={{ padding: '0.4rem 0.65rem', fontSize: 'var(--font-size-xs)' }}
                value={paymentMethodFilter}
                onChange={(e) => {
                  setPaymentMethodFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">All Methods</option>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="gpay">Google Pay</option>
                <option value="phonepe">PhonePe</option>
                <option value="paytm">Paytm</option>
                <option value="card">Card</option>
                <option value="razorpay">Razorpay</option>
              </select>

              {/* Sort By dropdown */}
              <select
                className="form-select"
                style={{ padding: '0.4rem 0.65rem', fontSize: 'var(--font-size-xs)' }}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="date">Sort by Date</option>
                <option value="totalAmount">Sort by Revenue</option>
                <option value="quantity">Sort by Quantity</option>
                <option value="paymentMethod">Sort by Method</option>
              </select>

              {/* Sort order toggle */}
              <button
                className="btn btn--outline btn--sm btn--icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                title={`Order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              >
                {sortOrder === 'asc' ? <FiArrowUp size={14} /> : <FiArrowDown size={14} />}
              </button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <Skeleton count={8} height={46} style={{ marginBottom: 6 }} />
          ) : transactions.length === 0 ? (
            <div className="empty-state" style={{ padding: 'var(--space-12) 0' }}>
              <FiFileText size={36} color="var(--color-text-muted)" />
              <p style={{ fontWeight: 500 }}>No sales found for the selected period.</p>
              <p style={{ fontSize: 'var(--font-size-xs)' }}>Try selecting a broader date range or clearing search filters.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr>
                    <th>Sale / Order ID</th>
                    <th>Type</th>
                    <th>Date & Time</th>
                    <th>Customer Name</th>
                    <th>Roll No</th>
                    <th>Department</th>
                    <th>Items Summary</th>
                    <th style={{ textAlign: 'center' }}>Qty</th>
                    <th style={{ textAlign: 'right' }}>Discount</th>
                    <th style={{ textAlign: 'right' }}>GST</th>
                    <th style={{ textAlign: 'right' }}>Total Amount</th>
                    <th>Payment Method</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t.transactionId}>
                      <td style={{ fontWeight: 600, fontFamily: 'monospace' }}>
                        {t.transactionId}
                      </td>
                      <td>
                        <span
                          className={`badge ${t.saleType === 'Offline' ? 'badge--pending' : 'badge--confirmed'}`}
                        >
                          {t.saleType}
                        </span>
                      </td>
                      <td>
                        <div style={{ whiteSpace: 'nowrap' }}>
                          <div style={{ fontWeight: 500 }}>{t.date}</div>
                          <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>{t.time}</div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 500 }}>{t.customerName}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>{t.rollNumber}</td>
                      <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-xs)' }}>{t.department}</td>
                      <td>
                        <div style={{ maxWidth: 220, fontSize: 'var(--font-size-xs)' }}>
                          {t.items.map((it, idx) => (
                            <span key={idx}>
                              {it.name} <span style={{ color: 'var(--color-text-muted)' }}>x{it.quantity}</span>
                              {idx < t.items.length - 1 ? ', ' : ''}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{t.quantity}</td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                        {t.discount > 0 ? `₹${t.discount}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--color-text-muted)' }}>
                        {t.gst > 0 ? `₹${Math.round(t.gst)}` : '-'}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--color-text-primary)' }}>
                        {formatCurrency(t.totalAmount)}
                      </td>
                      <td>
                        <span className="badge badge--instock" style={{ whiteSpace: 'nowrap' }}>
                          {t.paymentMethod}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            t.paymentStatus === 'refunded'
                              ? 'badge--cancelled'
                              : 'badge--completed'
                          }`}
                        >
                          {t.paymentStatus.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Backend Pagination */}
          {!loading && meta && (
            <div className="no-print">
              <Pagination meta={meta} onPageChange={handlePageChange} />
            </div>
          )}
        </div>

        {/* ============================================================
            REPORT FOOTER
            ============================================================ */}
        <div
          className="card"
          style={{
            padding: 'var(--space-4) var(--space-5)',
            borderTop: '2px solid var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: 'var(--space-2)' }}>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Report generated on: <strong style={{ color: 'var(--color-text-secondary)' }}>{new Date().toLocaleString('en-IN')}</strong> | Generated by: <strong style={{ color: 'var(--color-text-secondary)' }}>{user?.name || 'Admin'}</strong>
            </div>
            <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              Shop: <strong style={{ color: 'var(--color-text-secondary)' }}>Campus Stationery Hub</strong> | College: <strong style={{ color: 'var(--color-text-secondary)' }}>VIT Campus</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesReport;
