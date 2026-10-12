import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../../motion/gsap';
import { duration, ease } from '../../../motion/tokens';

const NODES = [
  ['Staff action', 'Call next'],
  ['REST request', 'The API call'],
  ['Server confirms', 'Saved first'],
  ['Socket.IO', 'Broadcast'],
  ['Every screen', 'Updates'],
];

const POINTS = [
  ['The server decides.', 'An action counts only once the backend confirms it. Screens never pretend.'],
  ['Screens follow.', 'Confirmed changes are pushed to everyone watching that queue.'],
  ['Nothing gets stuck.', 'If a screen misses an update, it can fetch the current state again.'],
];

export default function Realtime() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      const nodes = gsap.utils.toArray('[data-node]');
      const pulse = root.current.querySelector('[data-pulse]');
      const tl = gsap.timeline({
        repeat: -1,
        repeatDelay: 1.2,
        paused: true,
        defaults: { ease: ease.inOut },
      });
      tl.set(pulse, { x: 0, opacity: 1 });
      nodes.forEach((node, i) => {
        if (i > 0) tl.to(pulse, { x: () => node.offsetLeft + node.offsetWidth / 2 - pulse.offsetWidth / 2, duration: 0.7 });
        tl.to(node, { '--on': 1, duration: duration.fast, ease: ease.out }, '<0.4').to(node, { '--on': 0.35, duration: 0.6 }, '+=0.5');
      });
      tl.to(pulse, { opacity: 0, duration: duration.fast });
      gsap.set(nodes, { '--on': 0.35 });
      gsap.from('[data-node]', {
        y: 20,
        duration: duration.normal,
        ease: ease.out,
        stagger: 0.1,
        scrollTrigger: { trigger: root.current, start: 'top 70%', once: true, onEnter: () => tl.play() },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="realtime" className="border-t border-border-subtle bg-bg-primary py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="t-label">Real-time engine</p>
        <h2 className="t-section mt-5 max-w-3xl">Confirmed first. Then everywhere at once.</h2>

        <div className="mt-16 overflow-x-auto scrollbar-hide">
          <div data-track className="relative min-w-[44rem] pt-6">
            <div className="absolute left-4 right-4 top-[1.9rem] h-px bg-border-strong" aria-hidden="true" />
            <span data-pulse className="absolute left-0 top-[1.4rem] h-3 w-3 rounded-full bg-signal opacity-0 shadow-[0_0_24px_var(--qz-glow)]" aria-hidden="true" />
            <ol className="relative grid grid-cols-5">
              {NODES.map(([title, sub], i) => (
                <li key={title} data-node className="flex flex-col items-center text-center [--on:1]" style={{ opacity: 'calc(0.35 + var(--on) * 0.65)' }}>
                  <span className="grid h-[1.9rem] w-[1.9rem] place-items-center rounded-full border border-border-strong bg-bg-primary text-[0.65rem] font-semibold tabular-nums">
                    {i + 1}
                  </span>
                  <span className="mt-5 font-display text-lg font-semibold tracking-tight">{title}</span>
                  <span className="t-caption mt-1">{sub}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <ul className="mt-20 grid gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle md:grid-cols-3">
          {POINTS.map(([t, d]) => (
            <li key={t} className="bg-bg-secondary p-7">
              <h3 className="font-display text-xl font-semibold tracking-[-0.03em]">{t}</h3>
              <p className="t-body mt-2">{d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
