import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import Button from './Button';

/**
 * Modal — accessible modal dialog using React Portals.
 * Supports keyboard escape, overlay click-to-close, and focus trapping.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}) => {
  const overlayRef = useRef(null);
  const containerRef = useRef(null);
  const onCloseRef = useRef(onClose);
  const wasOpenRef = useRef(false);

  // Keep latest onClose without retriggering effects
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') onCloseRef.current?.();
      };
      document.addEventListener('keydown', handleKeyDown);

      // Focus only when opening (not on every re-render)
      if (!wasOpenRef.current) {
        setTimeout(() => {
          const root = containerRef.current;
          if (!root) return;
          const firstFocusable = root.querySelector(
            'input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus?.();
        }, 50);
      }

      wasOpenRef.current = true;

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.body.style.overflow = '';
        wasOpenRef.current = false;
      };
    }
    return () => {
      document.body.style.overflow = '';
      wasOpenRef.current = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div
      ref={overlayRef}
      className="modal-overlay animate-fade-in"
      onClick={closeOnOverlay ? (e) => e.target === overlayRef.current && onClose() : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div ref={containerRef} className={`modal-container modal-${size} animate-scale-in`}>
        {/* Header */}
        <div className="modal-header">
          <div>
            <h3 className="modal-title" id="modal-title">{title}</h3>
            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }
        .modal-container {
          background: var(--bg-elevated);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-lg), 0 0 60px rgba(20,184,166,0.1);
          display: flex;
          flex-direction: column;
          max-height: 90vh;
          width: 100%;
          overflow: hidden;
        }
        .modal-sm  { max-width: 400px; }
        .modal-md  { max-width: 560px; }
        .modal-lg  { max-width: 760px; }
        .modal-xl  { max-width: 1000px; }

        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-subtle);
          gap: 1rem;
        }
        .modal-title    { font-size: 1.1rem; font-weight: 600; color: var(--text-primary); }
        .modal-subtitle { font-size: 0.82rem; color: var(--text-muted); margin-top: 0.25rem; }
        .modal-close {
          background: var(--bg-card);
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          color: var(--text-secondary);
          padding: 0.35rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all var(--transition-fast);
          flex-shrink: 0;
        }
        .modal-close:hover { color: var(--text-primary); border-color: var(--border-strong); }
        .modal-body {
          padding: 1.5rem;
          overflow-y: auto;
          flex: 1;
        }
        .modal-footer {
          padding: 1.25rem 1.5rem;
          border-top: 1px solid var(--border-subtle);
          display: flex;
          justify-content: flex-end;
          gap: 0.75rem;
        }
      `}</style>
    </div>,
    document.body
  );
};

export default Modal;
