import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';

// Lightweight page-enter transition: content rises and settles. Re-runs per route.
export function PageReveal({ children, className }) {
  const ref = useRef(null);
  const { pathname } = useLocation();

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: duration.fast + 0.1, ease: ease.out, clearProps: 'transform,opacity' },
      );
    },
    { dependencies: [pathname], scope: ref },
  );

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
