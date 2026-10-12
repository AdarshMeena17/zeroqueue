import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../../motion/gsap';
import { duration, ease } from '../../../motion/tokens';

const STEPS = [
  { n: '01', title: 'Join', text: 'Pick a queue and take a token. You get your number and your place immediately.', chip: 'Token A-047 issued' },
  { n: '02', title: 'Track', text: 'See your position, the people ahead and an estimated wait. They update as the line moves.', chip: '#4 · 15 min' },
  { n: '03', title: 'Get served', text: 'When staff call you, your screen says so. No listening for a number.', chip: 'Your turn' },
];

export default function HowItWorks() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.from('[data-line]', {
        scaleX: 0,
        transformOrigin: 'left center',
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top 65%', end: 'bottom 70%', scrub: 0.5 },
      });
      gsap.from('[data-step]', {
        y: 28,
        opacity: 0,
        duration: duration.normal,
        ease: ease.out,
        stagger: 0.14,
        scrollTrigger: { trigger: root.current, start: 'top 75%', once: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="how" className="border-t border-border-subtle py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="t-label">How QueueZero works</p>
        <h2 className="t-section mt-5 max-w-3xl">Three moves. No standing around.</h2>

        <div className="relative mt-16">
          <div className="absolute left-0 right-0 top-[0.45rem] hidden h-px bg-border-strong md:block" aria-hidden="true">
            <div data-line className="h-full bg-signal" />
          </div>
          <ol className="grid gap-12 md:grid-cols-3 md:gap-8">
            {STEPS.map((s) => (
              <li key={s.n} data-step className="relative">
                <span className="relative z-10 mb-8 hidden h-3 w-3 rounded-full border border-text-primary bg-bg-secondary md:block" aria-hidden="true" />
                <span className="t-label">{s.n}</span>
                <h3 className="t-page mt-3">{s.title}</h3>
                <p className="t-body mt-3 max-w-sm">{s.text}</p>
                <span className="mt-6 inline-flex rounded-sm border border-border-strong px-2.5 py-1 text-xs font-medium tabular-nums text-text-secondary">
                  {s.chip}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
