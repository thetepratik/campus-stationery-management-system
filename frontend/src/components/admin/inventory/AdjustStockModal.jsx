import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Modal from '../../common/Modal';
import Input from '../../common/Input';
import Button from '../../common/Button';
import { inventoryApi } from '../../../services/inventoryApi';

const AdjustStockModal = ({ open, onClose, product, onSaved }) => {
  const [newStock, setNewStock] = useState('');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open && product) {
      setNewStock(String(product.currentStock));
      setNote('');
    }
  }, [open, product]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const value = Number(newStock);
    if (value < 0 || Number.isNaN(value)) {
      toast.error('Enter a valid stock quantity');
      return;
    }
    if (!note.trim()) {
      toast.error('A reason/note is required for manual stock adjustments');
      return;
    }
    if (value === product.currentStock) {
      toast.error('New stock value must be different from the current stock');
      return;
    }
    setSubmitting(true);
    try {
      const res = await inventoryApi.adjust(product._id, value, note);
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

  const diff = product ? Number(newStock) - product.currentStock : 0;

  return (
    <Modal open={open} onClose={onClose} title={`Adjust Stock — ${product.name}`} maxWidth={440}>
      <form onSubmit={handleSubmit}>
        <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)', marginBottom: 'var(--space-4)' }}>
          Current stock: <strong>{product.currentStock}</strong> units. Use this for corrections — damaged goods,
          stock-take discrepancies, returns, etc.
        </p>
        <Input
          id="newStock"
          label="New stock quantity"
          type="number"
          min="0"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value)}
        />
        {!Number.isNaN(diff) && diff !== 0 && (
          <p
            style={{
              fontSize: 'var(--font-size-sm)',
              color: diff > 0 ? 'var(--color-secondary)' : 'var(--color-danger)',
              marginBottom: 'var(--space-4)',
            }}
          >
            This will {diff > 0 ? 'increase' : 'decrease'} stock by <strong>{Math.abs(diff)}</strong> units.
          </p>
        )}
        <Input
          id="note"
          label="Reason (required)"
          placeholder="e.g. 3 units damaged in storage"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={submitting}>
            Confirm Adjustment
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdjustStockModal;
