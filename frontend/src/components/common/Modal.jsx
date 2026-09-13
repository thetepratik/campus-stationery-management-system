import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { FiX } from 'react-icons/fi';

const Modal = ({ open, onClose, title, children, maxWidth = 520 }) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth }}>
        <div
          className="flex items-center justify-between"
          style={{ padding: 'var(--space-5) var(--space-6)', borderBottom: '1px solid var(--color-border)' }}
        >
          <h3 style={{ fontSize: 'var(--font-size-lg)' }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', display: 'flex' }}
          >
            <FiX size={20} />
          </button>
        </div>
        <div style={{ padding: 'var(--space-6)', maxHeight: '75vh', overflowY: 'auto' }}>{children}</div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
