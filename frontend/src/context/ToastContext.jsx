import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from 'lucide-react';
import { gsap, prefersReducedMotion } from '../motion/gsap';
import { duration, ease } from '../motion/tokens';
import { cn } from '../utils/cn';

const ToastContext = createContext(null);

const MAX_VISIBLE = 4;
const LIFETIME = { success: 3800, info: 4200, warning: 5500, error: 6500 };
const STYLE = {
  success: { icon: CircleCheck, bar: 'bg-signal', tone: 'text-signal-ink' },
  info: { icon: Info, bar: 'bg-text-tertiary', tone: 'text-text-secondary' },
  warning: { icon: TriangleAlert, bar: 'bg-warn', tone: 'text-warn' },
  error: { icon: CircleAlert, bar: 'bg-danger', tone: 'text-danger' },
};

function ToastItem({ toast, onClose }) {
  const ref = useRef(null);
  const closing = useRef(false);
  const { icon: Icon, bar, tone } = STYLE[toast.type];

  useEffect(() => {
    if (prefersReducedMotion()) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 14, scale: 0.98 }, { opacity: 1, y: 0, scale: 1, duration: duration.fast, ease: ease.out });
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (prefersReducedMotion() || !ref.current) return onClose(toast.id);
    gsap.to(ref.current, { opacity: 0, y: 8, duration: 0.2, ease: 'power2.in', onComplete: () => onClose(toast.id) });
  }, [onClose, toast.id]);

  // `stamp` changes when an identical toast is raised again: the timer restarts, no duplicate appears.
  useEffect(() => {
    const t = setTimeout(close, LIFETIME[toast.type]);
    return () => clearTimeout(t);
  }, [close, toast.stamp, toast.type]);

  return (
    <div
      ref={ref}
      role={toast.type === 'error' ? 'alert' : 'status'}
      className="pointer-events-auto relative flex w-full items-start gap-3 overflow-hidden rounded-md border border-border-strong bg-bg-primary py-3 pl-5 pr-3 shadow-card"
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', bar)} aria-hidden="true" />
      <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', tone)} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        {toast.title && <p className="text-sm font-medium text-text-primary">{toast.title}</p>}
        <p className={cn('text-sm', toast.title ? 'text-text-secondary' : 'text-text-primary')}>{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Dismiss notification"
        className="rounded-sm p-1 text-text-tertiary transition-colors hover:text-text-primary"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const counter = useRef(0);

  const remove = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback((type, message, options = {}) => {
    if (!message) return;
    setToasts((list) => {
      const existing = list.find((t) => t.type === type && t.message === message);
      if (existing) return list.map((t) => (t === existing ? { ...t, stamp: t.stamp + 1 } : t));
      counter.current += 1;
      const next = [...list, { id: counter.current, type, message, title: options.title, stamp: 0 }];
      return next.slice(-MAX_VISIBLE);
    });
  }, []);

  const api = useMemo(
    () => ({
      success: (m, o) => push('success', m, o),
      error: (m, o) => push('error', m, o),
      warning: (m, o) => push('warning', m, o),
      info: (m, o) => push('info', m, o),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-[100] flex flex-col gap-2 sm:left-auto sm:right-6 sm:w-[24rem] lg:bottom-6"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={remove} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
