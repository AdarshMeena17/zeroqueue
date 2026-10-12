import { useEffect, useRef, useState } from 'react';
import { TokenDisplay } from '../motion/TokenDisplay';
import { gsap, useGSAP, prefersReducedMotion } from '../../motion/gsap';
import { duration, ease } from '../../motion/tokens';
import { Logo } from '../shared/Logo';
import { cn } from '../../utils/cn';

const FIRST = 41;
const LAST = 47;

// Brand panel for auth screens. The token cycling here is isolated DEMO state, not queue data.
export function AuthVisual() {
  const root = useRef(null);
  const [serving, setServing] = useState(43);

  useEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const id = setInterval(() => setServing((n) => (n >= LAST ? FIRST : n + 1)), 2600);
    return () => clearInterval(id);
  }, []);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const tl = gsap.timeline({ defaults: { ease: ease.out } });
      tl.from('[data-av=grid]', { opacity: 0, duration: duration.emphasis, ease: ease.inOut })
        .from('[data-av=logo]', { y: -10, opacity: 0, duration: duration.normal }, '-=0.5')
        .from('[data-av=line]', { yPercent: 110, duration: duration.emphasis, ease: ease.expo, stagger: 0.1 }, '-=0.3')
        .from('[data-av=token]', { opacity: 0, scale: 0.94, duration: duration.emphasis }, '-=0.6')
        .from('[data-av=rail] > *', { opacity: 0, y: 10, duration: duration.fast, stagger: 0.04 }, '-=0.5');
    },
    { scope: root },
  );

  const tokens = Array.from({ length: LAST - FIRST + 1 }, (_, i) => FIRST + i);

  return (
    <div ref={root} className="grain relative flex h-full flex-col justify-between overflow-hidden bg-obsidian p-12 text-bone xl:p-16">
      <div data-av="grid" className="bg-grid pointer-events-none absolute inset-0 opacity-70" aria-hidden="true" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full opacity-60 blur-3xl"
        style={{ background: 'radial-gradient(closest-side, rgba(198,244,50,0.22), transparent)' }}
      />

      <div data-av="logo" className="relative">
        <Logo />
      </div>

      <div className="relative">
        <p className="t-label !text-bone/65">Now serving</p>
        <div data-av="token" className="mt-3">
          <TokenDisplay value={`A-${String(serving).padStart(3, '0')}`} size="xl" />
        </div>
        <div data-av="rail" className="mt-8 flex items-center gap-2" aria-hidden="true">
          {tokens.map((n) => (
            <span
              key={n}
              className={cn(
                'rounded-sm border px-2 py-1 text-[0.65rem] font-medium tabular-nums tracking-wide transition-colors duration-300',
                n === serving ? 'border-transparent bg-signal text-ink' : n < serving ? 'border-white/10 text-bone/30' : 'border-white/20 text-bone/70',
              )}
            >
              {String(n).padStart(3, '0')}
            </span>
          ))}
        </div>
      </div>

      <div className="relative">
        <h2 className="t-section max-w-md">
          <span className="block overflow-hidden"><span data-av="line" className="block">Know your place</span></span>
          <span className="block overflow-hidden"><span data-av="line" className="block text-bone/55">without wasting your time.</span></span>
        </h2>
        <p className="t-caption mt-6 !text-bone/65">Illustrative demo — not live queue data.</p>
      </div>
    </div>
  );
}
