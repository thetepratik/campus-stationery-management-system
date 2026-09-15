import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Skeleton from 'react-loading-skeleton';
import { FiUser, FiClock, FiCreditCard, FiArrowLeft } from 'react-icons/fi';

import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { orderApi } from '../../services/orderApi';
import { paymentApi } from '../../services/paymentApi';
import { loadRazorpayScript } from '../../utils/loadRazorpayScript';
import Button from '../../components/common/Button';
import OrderSummary from '../../components/user/cart/OrderSummary';

/** Earliest pickup slot: 1 hour from now, rounded to the next 30-minute mark. */
const getMinPickupTime = () => {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 60);
  d.setMinutes(Math.ceil(d.getMinutes() / 30) * 30, 0, 0);
  return d;
};

const toLocalInputValue = (date) => {
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
};

const Checkout = () => {
  const { student } = useAuth();
  const { cart, loading, refresh } = useCart();
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/cart');
    }
  };

  const [pickupTime, setPickupTime] = useState(toLocalInputValue(getMinPickupTime()));
  const [placing, setPlacing] = useState(false);

  if (!loading && (!cart || cart.items.length === 0)) {
    return <Navigate to="/cart" replace />;
  }

  const handlePlaceOrder = async () => {
    await handleRazorpayCheckout();
  };

  const handleRazorpayCheckout = async () => {
    setPlacing(true);
    try {
      const scriptReady = await loadRazorpayScript();
      if (!scriptReady) {
        toast.error('Could not load the payment gateway. Check your internet connection and try again.');
        setPlacing(false);
        return;
      }

      // This already places the order and reserves stock — same as Cash on
      // Pickup — so the order exists in "pending payment" state even before
      // the Razorpay widget opens.
      const res = await orderApi.checkoutRazorpay(new Date(pickupTime).toISOString());
      const { order, razorpayOrderId, razorpayKeyId, amount } = res.data;

      const options = {
        key: razorpayKeyId,
        amount: Math.round(amount * 100),
        currency: 'INR',
        name: 'Campus Stationery',
        description: `Order ${order.orderId}`,
        order_id: razorpayOrderId,
        prefill: {
          name: student?.name,
          contact: student?.mobile,
        },
        theme: { color: '#4F46E5' },
        handler: async (response) => {
          try {
            await paymentApi.verify({
              orderId: order._id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast.success('Payment successful! Your order is confirmed.');
            await refresh();
            navigate(`/order-confirmation/${order._id}`);
          } catch (err) {
            toast.error(err.message || 'Payment verification failed. Please contact support.');
            setPlacing(false);
          }
        },
        modal: {
          ondismiss: () => {
            toast.info('Payment window closed. Your order is saved as pending payment — you can find it in My Orders.');
            setPlacing(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);
      razorpayInstance.on('payment.failed', () => {
        toast.error('Payment failed. Your order is saved as pending payment — you can retry from My Orders.');
        setPlacing(false);
      });
      razorpayInstance.open();
    } catch (err) {
      toast.error(err.message);
      setPlacing(false);
    }
  };

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)', maxWidth: 900 }}>
      <div className="flex items-center gap-3" style={{ marginBottom: 'var(--space-5)' }}>
        <button
          type="button"
          className="btn btn--outline btn--sm"
          onClick={handleBack}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
        >
          <FiArrowLeft size={16} /> Back
        </button>
        <h1 style={{ fontSize: 'var(--font-size-xl)', margin: 0 }}>Checkout</h1>
      </div>

      {loading ? (
        <Skeleton height={300} borderRadius={16} />
      ) : (
        <div className="pos-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {/* ---------- Student details (read-only, from profile) ---------- */}
            <div className="card panel">
              <div className="panel__header">
                <span className="panel__title flex items-center gap-2"><FiUser size={15} /> Student Details</span>
              </div>
              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.8 }}>
                <div><strong style={{ color: 'var(--color-text-primary)' }}>{student?.name}</strong></div>
                <div>Roll No: {student?.rollNumber}</div>
                <div>Department: {student?.department || 'Not set'}</div>
                <div>Mobile: {student?.mobile || 'Not set'}</div>
              </div>
            </div>

            {/* ---------- Pickup time ---------- */}
            <div className="card panel">
              <div className="panel__header">
                <span className="panel__title flex items-center gap-2"><FiClock size={15} /> Pickup Time</span>
              </div>
              <input
                type="datetime-local"
                className="form-input"
                style={{ width: '100%' }}
                value={pickupTime}
                min={toLocalInputValue(getMinPickupTime())}
                onChange={(e) => setPickupTime(e.target.value)}
              />
              <p className="form-hint" style={{ marginTop: 'var(--space-2)' }}>
                Choose a time at least 1 hour from now to collect your order at the shop counter.
              </p>
            </div>

            {/* ---------- Payment method ---------- */}
            <div className="card panel">
              <div className="panel__header">
                <span className="panel__title flex items-center gap-2"><FiCreditCard size={15} /> Payment Method</span>
              </div>
              <div
                style={{
                  padding: 'var(--space-4)',
                  border: '1px solid var(--color-primary)',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(79, 70, 229, 0.04)',
                }}
              >
                <div style={{ fontWeight: 600, fontSize: 'var(--font-size-md)', color: 'var(--color-primary)' }}>
                  Pay Online (UPI / Card / Net Banking / Wallet)
                </div>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginTop: 4 }}>
                  Secured by Razorpay — pay now and skip the counter queue
                </div>
              </div>
            </div>
          </div>

          {/* ---------- Order summary ---------- */}
          <div className="card panel">
            <div className="panel__header">
              <span className="panel__title">Order Summary</span>
            </div>
            {cart.items.map((item) => (
              <div key={item.product._id} className="flex justify-between" style={{ fontSize: 'var(--font-size-sm)', marginBottom: 6 }}>
                <span>{item.product.name} × {item.quantity}</span>
                <span>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(item.subtotal)}</span>
              </div>
            ))}
            <div style={{ borderTop: '1px solid var(--color-border)', margin: 'var(--space-3) 0' }} />
            <OrderSummary cart={cart} />
            <Button fullWidth size="lg" style={{ marginTop: 'var(--space-5)' }} onClick={handlePlaceOrder} loading={placing}>
              Proceed to Pay
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;
