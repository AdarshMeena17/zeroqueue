import { forwardRef, useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef } from 'react';
import { cn } from '../../utils/cn';

const FIRST = 40; // first token number rendered
const COUNT = 14; // A-040 … A-053

const MASK = 'linear-gradient(90deg, transparent 0, #000 6%, #000 88%, transparent 100%)';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const pad = (n) => String(n).padStart(3, '0');

/**
 * The QueueZero signature visual: a horizontal token rail.
 * Everything is a pure function of one continuous number `n` (the token being served):
 *   completed ← current → waiting → joining
 * Drive it with `ref.current.render(n)` from a GSAP tween or ScrollTrigger.
 * DEMO ONLY — marketing/auth screens. Never feed it real queue data from here.
 */
export const TokenStrip = forwardRef(function TokenStrip(
  { prefix = 'A', userToken = 47, initial = 41, showZones = true, className },
  ref,
) {
  const wrap = useRef(null);
  const items = useRef([]);
  const width = useRef(0);
  const current = useRef(initial);

  const render = useCallback(
    (n) => {
      current.current = n;
      const w = width.current || wrap.current?.clientWidth || 900;
      const compact = w < 640;
      const cardW = compact ? 76 : 112;
      const cardH = compact ? 62 : 84;
      const step = compact ? 84 : 128;
      const gap = compact ? 46 : 84;
      const anchor = compact ? w * 0.1 : w * 0.14;

      items.current.forEach((el, i) => {
        if (!el) return;
        const num = FIRST + i;
        const d = num - n;
        const lead = clamp(d, 0, 1);
        const x = anchor + d * step + lead * gap;

        let scale;
        let opacity;
        if (d < 0) {
          scale = 1.5 + d * 0.5; // shrinks as it leaves
          opacity = clamp(1 + d * 1.15, 0, 1);
        } else {
          scale = 1.5 - 0.5 * lead - 0.03 * clamp(d - 1, 0, 5); // current is dominant, waiting recedes
          opacity = clamp((w - x) / (step * 1.4), 0, 1);
        }

        const state = Math.abs(d) < 0.5 ? 'current' : d < 0 ? 'done' : 'waiting';
        const label = state === 'current' ? 'Now serving' : state === 'done' ? 'Done' : num === userToken ? 'You' : 'Waiting';

        el.style.width = `${cardW}px`;
        el.style.height = `${cardH}px`;
        el.style.marginTop = `${-cardH / 2}px`;
        el.style.transform = `translate3d(${x}px,0,0) scale(${scale.toFixed(3)})`;
        el.style.opacity = opacity.toFixed(3);
        el.style.visibility = opacity <= 0.01 ? 'hidden' : 'visible';
        el.style.zIndex = state === 'current' ? 5 : 3;
        if (el.dataset.state !== state) el.dataset.state = state;
        const labelEl = el.firstChild;
        if (labelEl.textContent !== label) labelEl.textContent = label;
        labelEl.style.fontSize = compact ? '8px' : '9.5px';
        el.lastChild.style.fontSize = compact ? '1.15rem' : '1.6rem';
      });
    },
    [userToken],
  );

  useImperativeHandle(ref, () => ({ render, getValue: () => current.current }), [render]);

  useLayoutEffect(() => {
    width.current = wrap.current?.clientWidth || 0;
    render(current.current);
  }, [render]);

  useEffect(() => {
    const el = wrap.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(() => {
      width.current = el.clientWidth;
      render(current.current);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [render]);

  return (
    <div
      ref={wrap}
      className={cn('relative h-56 w-full overflow-hidden sm:h-64', className)}
      style={{ maskImage: MASK, WebkitMaskImage: MASK }}
      aria-hidden="true"
    >
      {/* the rail */}
      <div data-rail className="absolute inset-x-0 top-1/2 h-px bg-border-strong" />
      {Array.from({ length: COUNT }, (_, i) => {
        const num = FIRST + i;
        return (
          <div
            key={num}
            ref={(el) => {
              items.current[i] = el;
            }}
            className="qz-token"
            data-you={num === userToken ? 'true' : 'false'}
            data-state="waiting"
          >
            <span className="font-medium uppercase tracking-[0.14em] opacity-70" />
            <span className="font-display font-semibold tracking-[-0.04em] [font-variant-numeric:tabular-nums]">
              {prefix}-{pad(num)}
            </span>
          </div>
        );
      })}
      {showZones && (
        <div className="absolute inset-x-0 bottom-0 hidden items-center justify-between px-[4%] sm:flex">
          {['Completed', 'Serving', 'Waiting', 'Joining'].map((z) => (
            <span key={z} className="t-label">
              {z}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

// Derived exactly the way the backend derives it (peopleAhead × averageServiceTime) so the demo reads true to the product.
export function demoStats(n, userToken = 47, avgServiceTime = 5) {
  const serving = Math.round(n);
  const isTurn = serving >= userToken;
  const peopleAhead = Math.max(0, userToken - serving - 1);
  return {
    isTurn,
    serving,
    peopleAhead,
    position: isTurn ? 0 : peopleAhead + 1,
    wait: isTurn ? 0 : peopleAhead * avgServiceTime,
  };
}
