import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';

/**
 * Displays a number and tweens to the new value when it changes (position, wait, counts).
 * The first render shows the value directly; only real changes animate.
 */
export function NumberChange({ value, prefix = '', suffix = '', pad = 0, className, placeholder = '—' }) {
  const fmt = (n) => `${prefix}${String(n).padStart(pad, '0')}${suffix}`;
  const ref = useRef(null);
  const shown = useRef(typeof value === 'number' ? value : null);
  const tween = useRef(null);

  useGSAP(
    () => {
      const el = ref.current;
      if (!el || typeof value !== 'number') {
        shown.current = null;
        return;
      }
      const from = shown.current;
      shown.current = value;
      if (from === null || from === value || prefersReducedMotion()) {
        el.textContent = fmt(value);
        return;
      }
      tween.current?.kill();
      const proxy = { v: from };
      tween.current = gsap.to(proxy, {
        v: value,
        duration: duration.normal,
        ease: ease.out,
        onUpdate: () => {
          el.textContent = fmt(Math.round(proxy.v));
        },
        onComplete: () => {
          el.textContent = fmt(value);
        },
      });
      gsap.fromTo(el, { y: from > value ? -6 : 6 }, { y: 0, duration: duration.fast, ease: ease.out });
    },
    { dependencies: [value, prefix, suffix, pad] },
  );

  return (
    <span ref={ref} className={className}>
      {typeof value === 'number' ? fmt(value) : placeholder}
    </span>
  );
}
