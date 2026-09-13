import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { inventoryApi } from '../../../services/inventoryApi';

const RestockModal = ({ open, onClose, product, onSaved }) => {
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setQuantity('');
      setNote('');
    }
  }, [open, product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!qty || qty <= 0) {
      toast.error('Enter a valid quantity to add');
      return;
    }
    setSubmitting(true);
    try {
      const res = await inventoryApi.restock(product._id, qty, note);
      toast.success(res.message);
      onSaved();
      onClose();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Restock — ${product.name}`} maxWidth={440}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Current stock: <strong>{product.currentStock}</strong> units
        </p>
        <Input
          id="quantity"
          label="Quantity to add"
          type="number"
          min="1"
          placeholder="e.g. 100"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
        />
        <Input
          id="note"
          label="Note (optional)"
          placeholder="e.g. Restocked from ABC Distributors"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        {quantity && Number(quantity) > 0 && (
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-secondary)', marginBottom: 'var(--space-4)' }}>
            New stock will be: <strong>{product.currentStock + Number(quantity)}</strong> units
          </p>
        )}
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="secondary" loading={submitting}>
            Confirm Restock
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default RestockModal;
