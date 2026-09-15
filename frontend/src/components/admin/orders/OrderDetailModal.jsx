import { useState } from "react";
import { toast } from "react-toastify";
import { FiCheck, FiX, FiClock, FiTrash2 } from "react-icons/fi";
import Modal from "../../common/Modal";
import Button from "../../common/Button";
import { formatCurrency } from "../../../utils/formatCurrency";
import { formatDateTime } from "../../../utils/formatDate";
import {
  STATUS_LABELS,
  NEXT_STATUS,
  isTerminalStatus,
} from "../../../utils/orderStatus";
import { adminOrderApi } from "../../../services/adminOrderApi";

const OrderDetailModal = ({ open, onClose, order, onUpdated, onDelete }) => {
  const [advancing, setAdvancing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  if (!order) return null;

  const nextStatus = NEXT_STATUS[order.status];
  const canCancel =
    !isTerminalStatus(order.status) && order.status !== "collected";

  const handleAdvance = async () => {
    if (!nextStatus) return;
    setAdvancing(true);
    try {
      const res = await adminOrderApi.updateStatus(order._id, nextStatus);
      toast.success(res.message);
      onUpdated(res.data.order);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdvancing(false);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    try {
      const res = await adminOrderApi.cancel(order._id, cancelReason);
      toast.success(res.message);
      onUpdated(res.data.order);
      setConfirmCancelOpen(false);
      setCancelReason("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title={`Order ${order.orderId}`}
        maxWidth={560}
      >
        <div
          className="flex justify-between items-start"
          style={{ marginBottom: "var(--space-5)" }}
        >
          <div>
            <div style={{ fontWeight: 600 }}>{order.student?.name}</div>
            <div
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-text-muted)",
              }}
            >
              {order.student?.rollNumber} · {order.student?.department}
            </div>
            {order.student?.mobile && (
              <div
                style={{
                  fontSize: "var(--font-size-sm)",
                  color: "var(--color-text-muted)",
                }}
              >
                {order.student.mobile}
              </div>
            )}
          </div>
          <span
            className={`badge badge--${
              order.paymentStatus === "paid" || order.status === "completed" || order.status === "collected"
                ? "instock"
                : order.paymentStatus === "failed"
                ? "outofstock"
                : "pending"
            }`}
          >
            {order.paymentStatus === "paid" || order.status === "completed" || order.status === "collected"
              ? "Paid"
              : order.paymentStatus === "failed"
              ? "Failed"
              : "Pending"}{" "}
            ·{" "}
            {order.paymentMethod === "cash-on-pickup"
              ? "cash"
              : order.paymentMethod}
          </span>
        </div>

        {/* Items */}
        <div
          style={{
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-4)",
            marginBottom: "var(--space-5)",
          }}
        >
          {order.items?.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-3"
              style={{ fontSize: "var(--font-size-sm)", marginBottom: 8 }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    objectFit: "cover",
                  }}
                />
              ) : null}
              <span style={{ flex: 1 }}>
                {item.name} × {item.quantity}
              </span>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              margin: "var(--space-2) 0",
            }}
          />
          {order.discountAmount > 0 && (
            <div
              className="flex justify-between"
              style={{
                fontSize: "var(--font-size-sm)",
                color: "var(--color-secondary)",
              }}
            >
              <span>Coupon ({order.couponCode})</span>
              <span>-{formatCurrency(order.discountAmount)}</span>
            </div>
          )}
          <div
            className="flex justify-between"
            style={{ fontWeight: 700, marginTop: 4 }}
          >
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <div
            className="form-label"
            style={{ marginBottom: "var(--space-2)" }}
          >
            Status History
          </div>
          {order.statusHistory?.map((h, i) => (
            <div
              key={i}
              className="flex items-center gap-2"
              style={{ fontSize: "var(--font-size-sm)", marginBottom: 4 }}
            >
              <FiClock size={12} color="var(--color-text-muted)" />
              <span style={{ fontWeight: 500 }}>{STATUS_LABELS[h.status]}</span>
              <span
                style={{
                  color: "var(--color-text-muted)",
                  fontSize: "var(--font-size-xs)",
                }}
              >
                {formatDateTime(h.changedAt)}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            fontSize: "var(--font-size-sm)",
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-5)",
          }}
        >
          Pickup time: <strong>{formatDateTime(order.pickupTime)}</strong>
        </div>

        {/* Actions */}
        <div className="flex gap-3 items-center justify-between">
          <div>
            {onDelete && (
              <Button
                variant="outline"
                style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                onClick={() => onDelete(order)}
              >
                <FiTrash2 size={14} /> Remove Order
              </Button>
            )}
          </div>
          <div className="flex gap-3 justify-end">
            {canCancel && (
              <Button variant="danger" onClick={() => setConfirmCancelOpen(true)}>
                <FiX size={14} /> Cancel Order
              </Button>
            )}
            {nextStatus && (
              <Button
                variant="secondary"
                onClick={handleAdvance}
                loading={advancing}
              >
                <FiCheck size={14} /> Mark as {STATUS_LABELS[nextStatus]}
              </Button>
            )}
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        title="Cancel this order?"
        maxWidth={420}
      >
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-4)",
            fontSize: "var(--font-size-sm)",
          }}
        >
          This will return all items to stock
          {order.paymentStatus === "paid"
            ? " and mark the payment as refunded"
            : ""}
          . This cannot be undone.
        </p>
        <textarea
          className="form-textarea"
          style={{
            width: "100%",
            minHeight: 70,
            marginBottom: "var(--space-4)",
          }}
          placeholder="Reason (optional)"
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => setConfirmCancelOpen(false)}
            disabled={cancelling}
          >
            Keep Order
          </Button>
          <Button variant="danger" onClick={handleCancel} loading={cancelling}>
            Yes, Cancel Order
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default OrderDetailModal;
