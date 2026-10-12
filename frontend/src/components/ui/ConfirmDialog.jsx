import { useEffect, useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';
import { Button } from './Button';

/**
 * Accessible confirmation dialog built on the native <dialog> element
 * (focus trap, Esc to close and inert background come from the platform).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (dialog && !open && dialog.open) dialog.close();
  }, [open]);

  useGSAP(
    () => {
      const dialog = ref.current;
      if (!open || !dialog) return;
      if (!dialog.open) dialog.showModal();
      if (prefersReducedMotion()) return;
      gsap.fromTo(ref.current, { opacity: 0, y: 14, scale: 0.97 }, { opacity: 1, y: 0, scale: 1, duration: duration.fast, ease: ease.out });
    },
    { dependencies: [open], scope: ref },
  );

  const handleCancelEvent = (e) => {
    e.preventDefault(); // we control closing through `open`
    if (!loading) onCancel?.();
  };

  const handleBackdrop = (e) => {
    if (e.target === ref.current && !loading) onCancel?.();
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      onCancel={handleCancelEvent}
      onClick={handleBackdrop}
      aria-labelledby="confirm-title"
      aria-describedby="confirm-desc"
      className="m-auto max-h-[90dvh] w-[min(92vw,26rem)] overflow-y-auto rounded-lg border border-border-strong bg-bg-primary p-0 text-text-primary shadow-2xl backdrop:bg-obsidian/70 backdrop:backdrop-blur-sm"
    >
      <div className="p-6">
        <h2 id="confirm-title" className="font-display text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {description && (
          <p id="confirm-desc" className="t-body mt-2">
            {description}
          </p>
        )}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={destructive ? 'danger' : 'primary'} onClick={onConfirm} isLoading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </dialog>
  );
}
