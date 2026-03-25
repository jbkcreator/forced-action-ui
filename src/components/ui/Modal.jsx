import { useEffect, useCallback, useRef } from 'react';

const FOCUSABLE = 'a[href],button:not([disabled]),input,select,textarea,[tabindex]:not([tabindex="-1"])';

export default function Modal({ isOpen, onClose, children, className = '', title }) {
  const containerRef = useRef(null);
  const previousFocusRef = useRef(null);

  const handleBackdrop = useCallback((e) => {
    if (e.target === e.currentTarget && onClose) onClose();
  }, [onClose]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && onClose) { onClose(); return; }
    if (e.key !== 'Tab') return;
    const el = containerRef.current;
    if (!el) return;
    const focusable = Array.from(el.querySelectorAll(FOCUSABLE));
    if (!focusable.length) { e.preventDefault(); return; }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  }, [onClose]);

  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => {
        const el = containerRef.current;
        if (el) {
          const first = el.querySelector(FOCUSABLE);
          if (first) first.focus();
        }
      });
    } else {
      document.body.style.overflow = '';
      if (previousFocusRef.current) previousFocusRef.current.focus();
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdrop}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div ref={containerRef} className={`animate-modal ${className}`}>
        {children}
      </div>
    </div>
  );
}

export function ModalClose({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition text-lg leading-none"
      aria-label="Close"
    >
      &#x2715;
    </button>
  );
}
