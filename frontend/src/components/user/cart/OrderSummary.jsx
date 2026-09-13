import { formatCurrency } from '../../../utils/formatCurrency';

const OrderSummary = ({ cart }) => {
  // Prevent errors if cart data is temporarily unavailable
  if (!cart) {
    return (
      <div
        className="card"
        style={{
          padding: 'var(--space-4)',
          color: 'var(--color-text-muted)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        Loading order summary...
      </div>
    );
  }

  const subtotal = Number(cart.subtotal || 0);
  const gstAmount = Number(cart.gstAmount || 0);
  const discountAmount = Number(cart.discountAmount || 0);

  /*
   * Prefer the total calculated by the backend.
   * This prevents frontend rounding/calculation differences.
   */
  const totalAmount =
    cart.totalAmount !== undefined &&
    cart.totalAmount !== null
      ? Number(cart.totalAmount)
      : Math.max(
          0,
          subtotal + gstAmount - discountAmount
        );

  const couponCode = cart.couponCode || '';

  return (
    <div>
      {/* =========================
          SUBTOTAL
      ========================== */}
      <div
        className="flex justify-between"
        style={{
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <span
          style={{
            color: 'var(--color-text-secondary)',
          }}
        >
          Subtotal
        </span>

        <span>
          {formatCurrency(subtotal)}
        </span>
      </div>

      {/* =========================
          GST
      ========================== */}
      <div
        className="flex justify-between"
        style={{
          fontSize: 'var(--font-size-sm)',
          marginBottom: 'var(--space-2)',
        }}
      >
        <span
          style={{
            color: 'var(--color-text-secondary)',
          }}
        >
          GST
        </span>

        <span>
          {formatCurrency(gstAmount)}
        </span>
      </div>

      {/* =========================
          COUPON DISCOUNT
      ========================== */}
      {discountAmount > 0 && (
        <div
          className="flex justify-between"
          style={{
            fontSize: 'var(--font-size-sm)',
            marginBottom: 'var(--space-2)',
            color: 'var(--color-secondary)',
          }}
        >
          <span>
            Coupon Discount
            {couponCode
              ? ` (${couponCode})`
              : ''}
          </span>

          <span>
            -{formatCurrency(discountAmount)}
          </span>
        </div>
      )}

      {/* =========================
          TOTAL
      ========================== */}
      <div
        className="flex justify-between items-center"
        style={{
          paddingTop: 'var(--space-3)',
          marginTop: 'var(--space-2)',
          borderTop:
            '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontWeight: 700,
            fontSize: 'var(--font-size-base)',
          }}
        >
          Total
        </span>

        <span
          style={{
            fontWeight: 700,
            fontSize: 'var(--font-size-xl)',
            color: 'var(--color-primary)',
          }}
        >
          {formatCurrency(totalAmount)}
        </span>
      </div>
    </div>
  );
};

export default OrderSummary;