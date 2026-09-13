import { Link, useNavigate } from 'react-router-dom';
import Skeleton from 'react-loading-skeleton';
import { FiShoppingCart } from 'react-icons/fi';

import { useCart } from '../../context/CartContext';
import Button from '../../components/common/Button';
import CartItemRow from '../../components/user/cart/CartItemRow';
import CouponBox from '../../components/user/cart/CouponBox';
import OrderSummary from '../../components/user/cart/OrderSummary';

const Cart = () => {
  const { cart, loading, updateItem, removeItem, applyCoupon, removeCoupon } = useCart();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        <Skeleton height={32} width={160} style={{ marginBottom: 20 }} />
        <Skeleton height={300} borderRadius={16} />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
        <div className="empty-state card" style={{ padding: 'var(--space-12)' }}>
          <FiShoppingCart size={28} color="var(--color-text-muted)" />
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn btn--primary" style={{ marginTop: 'var(--space-3)' }}>
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container" style={{ paddingTop: 'var(--space-6)' }}>
      <h1 style={{ fontSize: 'var(--font-size-xl)', marginBottom: 'var(--space-5)' }}>
        Your Cart ({cart.itemsCount} item{cart.itemsCount !== 1 ? 's' : ''})
      </h1>

      <div className="pos-grid">
        <div className="card panel">
          {cart.items.map((item) => (
            <CartItemRow
              key={item.product._id}
              item={item}
              onIncrement={(i) => updateItem(i.product._id, i.quantity + 1)}
              onDecrement={(i) =>
                i.quantity > 1 ? updateItem(i.product._id, i.quantity - 1) : removeItem(i.product._id)
              }
              onRemove={(i) => removeItem(i.product._id)}
            />
          ))}
        </div>

        <div className="card panel">
          <div className="panel__header">
            <span className="panel__title">Order Summary</span>
          </div>
          <CouponBox
            couponCode={cart.couponCode}
            couponError={cart.couponError}
            onApply={applyCoupon}
            onRemove={removeCoupon}
          />
          <OrderSummary cart={cart} />
          <Button fullWidth size="lg" style={{ marginTop: 'var(--space-5)' }} onClick={() => navigate('/checkout')}>
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Cart;
