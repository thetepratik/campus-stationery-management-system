import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import { FiPackage, FiChevronDown, FiChevronUp, FiDownload } from "react-icons/fi";

import { orderApi } from "../../services/orderApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDate";
import { STATUS_BADGE_MAP, STATUS_LABELS } from "../../utils/orderStatus";

const TABS = [
  { value: "", label: "All" },
  { value: "active", label: "Active" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

const ACTIVE_STATUSES = [
  "pending",
  "confirmed",
  "packing",
  "ready-for-pickup",
  "collected",
];

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await orderApi.list();
        setOrders(res.data.orders);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleDownloadInvoice = async (e, order) => {
    e.stopPropagation();
    setDownloadingId(order._id);
    try {
      await orderApi.downloadInvoice(order._id, order.orderId);
      toast.success("Invoice downloaded successfully");
    } catch (err) {
      toast.error(err.message || "Unable to generate invoice. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (tab === "active") return ACTIVE_STATUSES.includes(o.status);
    if (tab === "completed") return o.status === "completed";
    if (tab === "cancelled")
      return ["cancelled", "refunded"].includes(o.status);
    return true;
  });

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)" }}>
      <h1
        style={{
          fontSize: "var(--font-size-xl)",
          marginBottom: "var(--space-5)",
        }}
      >
        My Orders
      </h1>

      <div
        className="auth-role-toggle"
        style={{ width: 420, marginBottom: "var(--space-5)" }}
      >
        {TABS.map((t) => (
          <a
            key={t.value}
            className={tab === t.value ? "active" : ""}
            onClick={() => setTab(t.value)}
            style={{ cursor: "pointer" }}
          >
            {t.label}
          </a>
        ))}
      </div>

      {loading ? (
        <Skeleton
          height={100}
          count={3}
          style={{ marginBottom: 12 }}
          borderRadius={16}
        />
      ) : filteredOrders.length === 0 ? (
        <div
          className="empty-state card"
          style={{ padding: "var(--space-12)" }}
        >
          <FiPackage size={28} color="var(--color-text-muted)" />
          <p>No orders here yet.</p>
          <Link
            to="/products"
            className="btn btn--primary"
            style={{ marginTop: "var(--space-3)" }}
          >
            Browse Products
          </Link>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--space-4)",
          }}
        >
          {filteredOrders.map((order) => {
            const expanded = expandedId === order._id;
            return (
              <div key={order._id} className="card panel">
                <div
                  className="flex items-center justify-between"
                  style={{ cursor: "pointer" }}
                  onClick={() => setExpandedId(expanded ? null : order._id)}
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <strong>{order.orderId}</strong>
                      <span
                        className={`badge badge--${STATUS_BADGE_MAP[order.status] || "pending"}`}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "var(--font-size-xs)",
                        color: "var(--color-text-muted)",
                        marginTop: 4,
                      }}
                    >
                      {order.itemsCount} item{order.itemsCount !== 1 ? "s" : ""}{" "}
                      · {formatDateTime(order.createdAt)}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span style={{ fontWeight: 700 }}>
                      {formatCurrency(order.totalAmount)}
                    </span>
                    {expanded ? (
                      <FiChevronUp size={16} />
                    ) : (
                      <FiChevronDown size={16} />
                    )}
                  </div>
                </div>

                {expanded && (
                  <div
                    style={{
                      marginTop: "var(--space-4)",
                      paddingTop: "var(--space-4)",
                      borderTop: "1px solid var(--color-border)",
                    }}
                  >
                    <div
                      className="form-label"
                      style={{ marginBottom: "var(--space-2)" }}
                    >
                      Order Timeline
                    </div>
                    {order.statusHistory?.map((h, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2"
                        style={{
                          fontSize: "var(--font-size-sm)",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ fontWeight: 500 }}>
                          {STATUS_LABELS[h.status]}
                        </span>
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
                    <div
                      style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-secondary)",
                        marginTop: "var(--space-3)",
                      }}
                    >
                      Pickup:{" "}
                      <strong>{formatDateTime(order.pickupTime)}</strong>
                    </div>
                    {order.items?.length > 0 && (
                      <div style={{ marginTop: "var(--space-3)" }}>
                        {order.items.map((item) => (
                          <div
                            key={item._id}
                            className="flex items-center gap-3"
                            style={{ marginBottom: 8 }}
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
                                daylight: "cover"
                                }}
                              />
                            ) : null}
                            <span
                              style={{
                                flex: 1,
                                fontSize: "var(--font-size-sm)",
                              }}
                            >
                              {item.name} × {item.quantity}
                            </span>
                            <span style={{ fontWeight: 600 }}>
                              {formatCurrency(item.subtotal)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    <div
                      style={{
                        fontSize: "var(--font-size-sm)",
                        color: "var(--color-text-secondary)",
                        marginTop: 4,
                      }}
                    >
                      Payment:{" "}
                      <strong>
                        {order.paymentStatus === "paid" ||
                        order.status === "completed" ||
                        order.status === "collected"
                          ? "Paid"
                          : order.paymentStatus === "failed"
                          ? "Failed"
                          : "Pending"}
                      </strong>{" "}
                      (Razorpay)
                    </div>

                    <div
                      style={{
                        marginTop: "var(--space-4)",
                        paddingTop: "var(--space-3)",
                        borderTop: "1px dashed var(--color-border)",
                        display: "flex",
                        justifyContent: "flex-end",
                      }}
                    >
                      <button
                        type="button"
                        className="btn btn--outline btn--sm"
                        onClick={(e) => handleDownloadInvoice(e, order)}
                        disabled={downloadingId === order._id}
                        style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
                      >
                        <FiDownload size={14} />
                        {downloadingId === order._id ? "Generating PDF..." : "Download Invoice PDF"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyOrders;
