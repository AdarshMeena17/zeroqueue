import { useEffect, useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';
import { cn } from '../../utils/cn';

const SIZES = {
  hero: 'text-[clamp(3.25rem,15vw,13rem)]',
  xl: 'text-[clamp(3rem,13vw,8rem)]',
  lg: 'text-6xl sm:text-7xl',
  md: 'text-4xl sm:text-5xl',
  sm: 'text-2xl',
};

/**
 * A queue token as a product object: prefix recedes, number leads.
 * When `value` really changes: the previous value is clipped out upward, the new one rises in.
 * (The outgoing copy is a short-lived clone so React's DOM is never mutated.)
 */
export function TokenDisplay({ value, size = 'lg', tone = 'default', className }) {
  const wrap = useRef(null);
  const inner = useRef(null);
  const previous = useRef(value);
  const lastHTML = useRef('');

  // Declared before the bookkeeping effect: useGSAP runs first, so lastHTML still holds the OLD markup.
  useGSAP(
    () => {
      if (previous.current === value) return;
      previous.current = value;
      const node = inner.current;
      if (prefersReducedMotion() || !node) return;
      const tl = gsap.timeline();
      if (lastHTML.current) {
        const ghost = document.createElement('span');
        ghost.className = node.className;
        ghost.innerHTML = lastHTML.current;
        ghost.setAttribute('aria-hidden', 'true');
        ghost.setAttribute('data-token-ghost', '');
        Object.assign(ghost.style, { position: 'absolute', left: '0', top: '0' });
        wrap.current.appendChild(ghost);
        tl.to(ghost, { yPercent: -70, opacity: 0, duration: duration.fast, ease: 'power3.in', onComplete: () => ghost.remove() });
      }
      tl.fromTo(node, { yPercent: 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: duration.normal, ease: ease.expo }, lastHTML.current ? '-=0.12' : 0);
    },
    { dependencies: [value] },
  );

  useEffect(() => {
    lastHTML.current = inner.current ? inner.current.innerHTML : '';
  });

  useEffect(() => {
    const el = wrap.current;
    return () => el?.querySelectorAll('[data-token-ghost]').forEach((g) => g.remove());
  }, []);

  const match = value ? /^(.*?)-(.+)$/.exec(value) : null;

  return (
    <span
      ref={wrap}
      className={cn('t-token relative inline-flex overflow-hidden pb-[0.08em] align-bottom', SIZES[size], tone === 'signal' && 'text-signal-ink', className)}
      role="img"
      aria-label={value || 'No token'}
    >
      <span ref={inner} className="inline-flex items-baseline" aria-hidden="true">
        {match ? (
          <>
            <span className="opacity-45">{match[1]}</span>
            <span className="opacity-30">-</span>
            <span>{match[2]}</span>
          </>
        ) : (
          <span className="opacity-30">—</span>
        )}
      </span>
    </span>
  );
}
