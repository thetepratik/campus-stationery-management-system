import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "react-toastify";
import Skeleton from "react-loading-skeleton";
import { FiCheckCircle, FiClock, FiMapPin } from "react-icons/fi";

import { orderApi } from "../../services/orderApi";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDate";

const OrderConfirmation = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await orderApi.get(id);
        setOrder(res.data.order);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <div
        className="container"
        style={{ paddingTop: "var(--space-8)", maxWidth: 560 }}
      >
        <Skeleton height={300} borderRadius={16} />
      </div>
    );
  }

  if (!order) return null;

  return (
    <div
      className="container"
      style={{ paddingTop: "var(--space-8)", maxWidth: 560 }}
    >
      <div
        className="card panel"
        style={{ textAlign: "center", padding: "var(--space-8)" }}
      >
        <FiCheckCircle
          size={48}
          color="var(--color-secondary)"
          style={{ marginBottom: "var(--space-4)" }}
        />
        <h1
          style={{
            fontSize: "var(--font-size-xl)",
            marginBottom: "var(--space-2)",
          }}
        >
          Order Placed!
        </h1>
        <p
          style={{
            color: "var(--color-text-secondary)",
            marginBottom: "var(--space-6)",
          }}
        >
          Your order <strong>{order.orderId}</strong> has been placed
          successfully.
        </p>

        <div
          style={{
            textAlign: "left",
            border: "1px dashed var(--color-border-strong)",
            borderRadius: "var(--radius-md)",
            padding: "var(--space-5)",
            marginBottom: "var(--space-6)",
          }}
        >
          {order.items.map((item) => (
            <div
              key={item._id}
              className="flex items-center gap-3"
              style={{ fontSize: "var(--font-size-sm)", marginBottom: 10 }}
            >
              {item.image ? (
                <img
                  src={item.image}
                  alt=""
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    objectFit: "cover",
                  }}
                />
              ) : null}
              <div style={{ flex: 1 }}>
                <div>
                  {item.name} × {item.quantity}
                </div>
              </div>
              <span>{formatCurrency(item.subtotal)}</span>
            </div>
          ))}
          <div
            style={{
              borderTop: "1px solid var(--color-border)",
              margin: "var(--space-3) 0",
            }}
          />
          <div className="flex justify-between" style={{ fontWeight: 700 }}>
            <span>Total</span>
            <span>{formatCurrency(order.totalAmount)}</span>
          </div>

          <div
            className="flex items-center gap-2"
            style={{
              marginTop: "var(--space-4)",
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-secondary)",
            }}
          >
            <FiClock size={14} /> Pickup: {formatDateTime(order.pickupTime)}
          </div>
          <div
            className="flex items-center gap-2"
            style={{
              marginTop: 4,
              fontSize: "var(--font-size-sm)",
              color: "var(--color-text-secondary)",
            }}
          >
            <FiMapPin size={14} /> Collect at the Campus Stationery counter
          </div>
          <div style={{ marginTop: "var(--space-3)" }}>
            {order.paymentStatus === "paid" ? (
              <span className="badge badge--completed">Paid via Razorpay</span>
            ) : (
              <span className="badge badge--pending">
                {order.paymentMethod === "razorpay"
                  ? "Payment Pending"
                  : "Pay Cash at Pickup"}
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Link to="/products" className="btn btn--outline">
            Continue Shopping
          </Link>
          <Link to="/" className="btn btn--primary">
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
