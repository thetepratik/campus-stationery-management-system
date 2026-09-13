import { useState } from 'react';
import { toast } from 'react-toastify';
import { FiShoppingBag } from 'react-icons/fi';

import { saleApi } from '../../services/saleApi';
import Button from '../../components/common/Button';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ProductSearchPanel from '../../components/admin/sales/ProductSearchPanel';
import SaleCartPanel from '../../components/admin/sales/SaleCartPanel';
import SaleDetailsForm from '../../components/admin/sales/SaleDetailsForm';
import ReceiptModal from '../../components/admin/sales/ReceiptModal';

const DEFAULT_DETAILS = { customerName: '', rollNumber: '', department: '', remarks: '', paymentMethod: 'cash' };

const OfflineSales = () => {
  const [cart, setCart] = useState([]);
  const [details, setDetails] = useState(DEFAULT_DETAILS);

  const [step, setStep] = useState('idle'); // idle -> payment-confirm -> stock-confirm
  const [submitting, setSubmitting] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);

  const cartQuantities = Object.fromEntries(cart.map((i) => [i._id, i.quantity]));

  const handleAdd = (product) => {
    setCart((prev) => {
      const existing = prev.find((i) => i._id === product._id);
      if (existing) {
        if (existing.quantity >= product.currentStock) {
          toast.error('No more stock available for this product');
          return prev;
        }
        return prev.map((i) => (i._id === product._id ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleIncrement = (id) => {
    setCart((prev) =>
      prev.map((i) => {
        if (i._id !== id) return i;
        if (i.quantity >= i.currentStock) {
          toast.error('No more stock available for this product');
          return i;
        }
        return { ...i, quantity: i.quantity + 1 };
      })
    );
  };

  const handleDecrement = (id) => {
    setCart((prev) =>
      prev
        .map((i) => (i._id === id ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0)
    );
  };

  const handleRemove = (id) => setCart((prev) => prev.filter((i) => i._id !== id));

  const resetSale = () => {
    setCart([]);
    setDetails(DEFAULT_DETAILS);
    setStep('idle');
  };

  const startCheckout = () => {
    if (!cart.length) {
      toast.error('Add at least one product to record a sale');
      return;
    }
    setStep('payment-confirm');
  };

  const confirmPaymentReceived = () => {
    setStep('stock-confirm');
  };

  const confirmFinalizeSale = async () => {
    setSubmitting(true);
    try {
      const payload = {
        items: cart.map((i) => ({ productId: i._id, quantity: i.quantity })),
        paymentMethod: details.paymentMethod,
        customerName: details.customerName,
        rollNumber: details.rollNumber,
        department: details.department,
        remarks: details.remarks,
        paymentConfirmed: true,
      };
      const res = await saleApi.create(payload);
      toast.success(res.message);
      setCompletedSale(res.data.sale);
      setStep('idle');
      setCart([]);
      setDetails(DEFAULT_DETAILS);
    } catch (err) {
      toast.error(err.message);
      setStep('idle');
    } finally {
      setSubmitting(false);
    }
  };

  const totalAmount = cart.reduce((sum, i) => sum + i.sellingPrice * i.quantity, 0);

  return (
    <div>
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <h1 style={{ fontSize: 'var(--font-size-xl)' }}>Offline Sales (POS)</h1>
          <p style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Search for a product, build the sale, and confirm to record it.
          </p>
        </div>
        {cart.length > 0 && (
          <Button variant="secondary" size="lg" onClick={startCheckout}>
            <FiShoppingBag size={16} /> Record Sale — {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(totalAmount)}
          </Button>
        )}
      </div>

      <div className="pos-grid">
        <ProductSearchPanel onAdd={handleAdd} cartQuantities={cartQuantities} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
          <SaleCartPanel cart={cart} onIncrement={handleIncrement} onDecrement={handleDecrement} onRemove={handleRemove} />
          {cart.length > 0 && <SaleDetailsForm details={details} onChange={setDetails} />}
        </div>
      </div>

      {/* Confirmation 1: Did you receive payment? */}
      <ConfirmDialog
        open={step === 'payment-confirm'}
        onClose={() => setStep('idle')}
        onConfirm={confirmPaymentReceived}
        title="Confirm Payment"
        message="Have you received the payment from the customer?"
        confirmLabel="Yes, Payment Received"
        variant="secondary"
      />

      {/* Confirmation 2: Reduce stock permanently? */}
      <ConfirmDialog
        open={step === 'stock-confirm'}
        onClose={() => setStep('idle')}
        onConfirm={confirmFinalizeSale}
        title="Confirm Sale"
        message="This action will permanently reduce stock and save the sale. This cannot be undone. Do you want to continue?"
        confirmLabel="Yes, Confirm Sale"
        variant="danger"
        loading={submitting}
      />

      <ReceiptModal open={!!completedSale} onClose={() => setCompletedSale(null)} sale={completedSale} />
    </div>
  );
};

export default OfflineSales;
