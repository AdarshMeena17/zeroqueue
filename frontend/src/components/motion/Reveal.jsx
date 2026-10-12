import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';

/**
 * Fade-up reveal. Animates the wrapper, or — with `stagger` — each match of `selector` inside it.
 * `scroll` defers the reveal until the block enters the viewport. Honors prefers-reduced-motion.
 */
export function Reveal({
  as: Tag = 'div',
  children,
  className,
  y = 22,
  delay = 0,
  scroll = false,
  stagger = 0,
  selector = '[data-reveal]',
  ...props
}) {
  const ref = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const targets = stagger ? gsap.utils.toArray(selector, ref.current) : ref.current;
      if (stagger && !targets.length) return;
      gsap.from(targets, {
        opacity: 0,
        y,
        duration: duration.normal,
        ease: ease.out,
        delay,
        stagger,
        clearProps: 'transform,opacity',
        scrollTrigger: scroll ? { trigger: ref.current, start: 'top 88%', once: true } : undefined,
      });
    },
    { scope: ref },
  );

  return (
    <Tag ref={ref} className={className} {...props}>
      {children}
    </Tag>
  );
}
