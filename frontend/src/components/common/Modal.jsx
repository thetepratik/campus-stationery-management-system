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
      <div
        className="modal"
        style={{
          maxWidth: `min(${typeof maxWidth === 'number' ? `${maxWidth}px` : maxWidth}, calc(100vw - 24px))`,
          width: '100%',
          boxSizing: 'border-box',
          margin: 'auto',
        }}
      >
        <div
          className="flex items-center justify-between modal__header"
          style={{ padding: 'var(--space-4) var(--space-5)', borderBottom: '1px solid var(--color-border)' }}
        >
          <h3 style={{ fontSize: 'var(--font-size-lg)', margin: 0 }}>{title}</h3>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'none', border: 'none', color: 'var(--color-text-muted)', display: 'flex', cursor: 'pointer', padding: 4 }}
          >
            <FiX size={20} />
          </button>
        </div>
        <div className="modal__body" style={{ padding: 'var(--space-5)', maxHeight: 'calc(100vh - 120px)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
