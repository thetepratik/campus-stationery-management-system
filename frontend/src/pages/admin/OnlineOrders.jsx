import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';

import { adminOrderApi } from '../../services/adminOrderApi';
import useDebounce from '../../hooks/useDebounce';

import Pagination from '../../components/common/Pagination';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import OrderFilters from '../../components/admin/orders/OrderFilters';
import OrderTable from '../../components/admin/orders/OrderTable';
import OrderDetailModal from '../../components/admin/orders/OrderDetailModal';

const DEFAULT_FILTERS = { search: '', status: '', paymentStatus: '', from: '', to: '', page: 1 };

const OnlineOrders = () => {
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const debouncedSearch = useDebounce(filters.search, 400);

  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminOrderApi.list({ ...filters, search: debouncedSearch });
      setOrders(res.data.orders);
      setMeta(res.meta);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }, [filters, debouncedSearch]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleView = async (order) => {
    try {
      const res = await adminOrderApi.get(order._id);
      setSelectedOrder(res.data.order);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdated = (updatedOrder) => {
    setSelectedOrder(updatedOrder);
    fetchOrders();
  };

  const handleDeleteOrder = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await adminOrderApi.delete(deleteTarget._id);
      toast.success(res.message || 'Order removed successfully');
      if (selectedOrder?._id === deleteTarget._id) {
        setSelectedOrder(null);
      }
      setDeleteTarget(null);
      fetchOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="card panel">
        <div className="panel__header">
          <span className="panel__title">Online Orders</span>
          {meta && (
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)' }}>
              {meta.totalCount} order{meta.totalCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
        <OrderFilters filters={filters} onChange={setFilters} />
        {loading ? (
          <Skeleton height={48} count={6} style={{ marginBottom: 8 }} />
        ) : (
          <>
            <OrderTable orders={orders} onView={handleView} onDelete={(order) => setDeleteTarget(order)} />
            <Pagination meta={meta} onPageChange={(page) => setFilters((f) => ({ ...f, page }))} />
          </>
        )}
      </div>

      <OrderDetailModal
        open={!!selectedOrder}
        onClose={() => setSelectedOrder(null)}
        order={selectedOrder}
        onUpdated={handleUpdated}
        onDelete={(order) => setDeleteTarget(order)}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteOrder}
        loading={deleting}
        title="Remove Order"
        message={`Are you sure you want to remove order #${deleteTarget?.orderId}? This cannot be undone.`}
        confirmLabel="Remove"
      />
    </div>
  );
};

export default OnlineOrders;
