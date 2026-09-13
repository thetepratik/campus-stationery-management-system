import { useState } from 'react';
import { FiX } from 'react-icons/fi';
import Button from '../../common/Button';
import Modal from '../../common/Modal';
import Select from '../../common/Select';
import Input from '../../common/Input';

const BulkActionsBar = ({ selectedCount, onClear, onBulkDelete, onBulkStatus, onBulkPrice }) => {
  const [priceModalOpen, setPriceModalOpen] = useState(false);
  const [mode, setMode] = useState('percent-increase');
  const [value, setValue] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (selectedCount === 0) return null;

  const handlePriceSubmit = async (e) => {
    e.preventDefault();
    if (!value || Number(value) < 0) return;
    setSubmitting(true);
    try {
      await onBulkPrice(mode, Number(value));
      setPriceModalOpen(false);
      setValue('');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div
        className="card flex items-center justify-between"
        style={{
          padding: 'var(--space-3) var(--space-5)',
          marginBottom: 'var(--space-4)',
          background: 'var(--color-primary-light)',
          border: '1px solid var(--color-primary)',
        }}
      >
        <div className="flex items-center gap-3">
          <button onClick={onClear} aria-label="Clear selection" style={{ background: 'none', border: 'none', display: 'flex' }}>
            <FiX size={18} color="var(--color-primary)" />
          </button>
          <span style={{ fontWeight: 600, color: 'var(--color-primary)' }}>{selectedCount} selected</span>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPriceModalOpen(true)}>
            Bulk Price Update
          </Button>
          <Button size="sm" variant="outline" onClick={() => onBulkStatus('active')}>
            Mark Active
          </Button>
          <Button size="sm" variant="outline" onClick={() => onBulkStatus('inactive')}>
            Mark Inactive
          </Button>
          <Button size="sm" variant="danger" onClick={onBulkDelete}>
            Delete
          </Button>
        </div>
      </div>

      <Modal open={priceModalOpen} onClose={() => setPriceModalOpen(false)} title="Bulk Price Update" maxWidth={420}>
        <form onSubmit={handlePriceSubmit}>
          <Select
            id="mode"
            label="Update Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            options={[
              { value: 'percent-increase', label: 'Increase by %' },
              { value: 'percent-decrease', label: 'Decrease by %' },
              { value: 'set-price', label: 'Set exact price (₹)' },
            ]}
          />
          <Input
            id="value"
            label={mode === 'set-price' ? 'New Price (₹)' : 'Percentage (%)'}
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
          <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-4)' }}>
            This will update the selling price for all {selectedCount} selected product(s).
          </p>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" type="button" onClick={() => setPriceModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              Apply
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
};

export default BulkActionsBar;
