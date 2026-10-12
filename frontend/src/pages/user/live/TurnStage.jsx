import { useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { gsap, useGSAP, prefersReducedMotion } from '../../../motion/gsap';
import { duration, ease } from '../../../motion/tokens';
import { TokenDisplay } from '../../../components/motion/TokenDisplay';
import { ConnectionIndicator } from '../../../components/queue/ConnectionIndicator';

/**
 * YOUR TURN. Shown only while the backend-verified entry status is `serving`.
 * An accent surface expands from the token, the token takes over, everything else steps back.
 * The backend supplies no counter or window, so the instruction is intentionally generic.
 */
export function TurnStage({ token, queueName, departmentName }) {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const q = gsap.utils.selector(root);
      gsap
        .timeline({ defaults: { ease: ease.out } })
        .fromTo(root.current, { clipPath: 'circle(0% at 50% 42%)' }, { clipPath: 'circle(150% at 50% 42%)', duration: duration.emphasis, ease: 'power3.inOut', clearProps: 'clipPath' })
        .from(q('[data-turn=line]'), { yPercent: 110, duration: duration.emphasis - 0.2, ease: ease.expo, stagger: 0.08 }, '-=0.45')
        .from(q('[data-turn=token]'), { scale: 0.9, opacity: 0, duration: duration.emphasis, ease: ease.expo }, '-=0.55')
        .from(q('[data-turn=note]'), { y: 14, opacity: 0, duration: duration.normal }, '-=0.4')
        .from(q('[data-turn=arrow]'), { y: -8, opacity: 0, duration: duration.normal }, '-=0.3');
      // a slow, quiet cue that the next move is physical
      gsap.to(q('[data-turn=arrow]'), { y: 8, duration: 1.1, ease: ease.inOut, repeat: -1, yoyo: true, delay: 1.4 });
    },
    { scope: root },
  );

  return (
    <div
      ref={root}
      role="status"
      aria-live="assertive"
      data-surface="signal"
      className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-signal text-ink"
    >
      <div className="flex items-center justify-between px-5 py-5 sm:px-10">
        <p className="text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-ink/65">
          {departmentName ? `${departmentName} · ` : ''}
          {queueName}
        </p>
        <ConnectionIndicator className="!border-ink/20 !text-ink/70" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-5 pb-16 text-center">
        <h1 className="t-display overflow-hidden pb-[0.08em]">
          <span data-turn="line" className="block">Your turn</span>
        </h1>
        <div data-turn="token" className="mt-6">
          <TokenDisplay value={token} size="hero" className="[&_span]:!opacity-100" />
        </div>
        <p data-turn="note" className="mt-6 font-display text-2xl font-medium tracking-[-0.03em] sm:text-3xl">
          Proceed to the counter.
        </p>
        <ArrowDown data-turn="arrow" className="mt-8 h-8 w-8" aria-hidden="true" />
      </div>
    </div>
  );
}
