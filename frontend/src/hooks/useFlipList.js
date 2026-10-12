import { useLayoutEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../motion/gsap';
import { duration, ease } from '../motion/tokens';

/**
 * Animates a list whose order/membership changes with real data:
 *  - rows that stay move smoothly from their old position (FLIP)
 *  - rows that appear fade/rise in
 *  - rows that leave are replaced by a short-lived ghost that slides out, drawn in a separate overlay
 *    so React's own DOM is never mutated.
 * Rows must carry data-flip-key. `listRef` = element containing the rows, `ghostRef` = an empty absolutely
 * positioned overlay (inset-0) inside the same relatively positioned parent as the list.
 * `exit` sets the ghost's exit direction, e.g. { x: -24, y: -12 }.
 */
export function useFlipList(listRef, ghostRef, keyString, exit = { x: -28, y: -10 }) {
  const previous = useRef(new Map());

  useLayoutEffect(() => {
    const list = listRef.current;
    const layer = ghostRef.current;
    if (!list || !layer) return undefined;
    const origin = list.getBoundingClientRect();
    const next = new Map();
    list.querySelectorAll('[data-flip-key]').forEach((node) => {
      const r = node.getBoundingClientRect();
      next.set(node.dataset.flipKey, { top: r.top - origin.top, left: r.left - origin.left, width: r.width, node });
    });

    const ghosts = [];
    if (!prefersReducedMotion() && previous.current.size) {
      next.forEach((cur, key) => {
        const old = previous.current.get(key);
        if (old) {
          const dy = old.top - cur.top;
          if (Math.abs(dy) > 1) gsap.fromTo(cur.node, { y: dy }, { y: 0, duration: duration.normal - 0.1, ease: ease.out, overwrite: 'auto', clearProps: 'transform' });
        } else {
          gsap.fromTo(cur.node, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: duration.normal - 0.15, ease: ease.out, clearProps: 'transform,opacity' });
        }
      });
      previous.current.forEach((old, key) => {
        if (next.has(key)) return;
        const ghost = old.clone;
        ghost.removeAttribute('data-flip-key');
        ghost.setAttribute('aria-hidden', 'true');
        Object.assign(ghost.style, { position: 'absolute', top: `${old.top}px`, left: `${old.left}px`, width: `${old.width}px`, margin: '0', pointerEvents: 'none' });
        layer.appendChild(ghost);
        ghosts.push(ghost);
        gsap.to(ghost, { opacity: 0, x: exit.x, y: exit.y, duration: duration.fast, ease: 'power2.in', onComplete: () => ghost.remove() });
      });
    }

    previous.current = new Map(
      [...next].map(([key, v]) => [key, { top: v.top, left: v.left, width: v.width, clone: v.node.cloneNode(true) }]),
    );
    return () => ghosts.forEach((g) => g.remove());
  }, [listRef, ghostRef, keyString, exit.x, exit.y]);
}
