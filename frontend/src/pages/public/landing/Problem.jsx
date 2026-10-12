import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../../motion/gsap';
import { Reveal } from '../../../components/motion/Reveal';

const STATEMENT =
  "A physical line tells you nothing. You can't see who is ahead. You can't tell how long it will take. And you can't look away, because the moment you do, you might miss your turn.";

const COSTS = [
  ['01', 'Blind', 'No number, no position. Just a crowd and a guess.'],
  ['02', 'Open-ended', 'No estimate. "Soon" is the only answer anyone has.'],
  ['03', 'Tethered', 'Stepping away feels risky, so everyone stays put and watches.'],
];

export default function Problem() {
  const root = useRef(null);

  useGSAP(
    () => {
      if (prefersReducedMotion()) return;
      gsap.fromTo(
        '[data-w]',
        { opacity: 0.18 },
        {
          opacity: 1,
          ease: 'none',
          stagger: 0.12,
          scrollTrigger: { trigger: root.current, start: 'top 70%', end: 'center 40%', scrub: 0.4 },
        },
      );
    },
    { scope: root },
  );

  return (
    <section ref={root} id="problem" className="relative border-t border-border-subtle py-28 sm:py-40">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="t-label">The problem</p>
        <p className="t-section mt-8 max-w-5xl">
          {STATEMENT.split(' ').map((word, i) => (
            <span key={i} data-w className="inline-block pr-[0.28em]">
              {word}
            </span>
          ))}
        </p>

        <Reveal scroll stagger={0.1} className="mt-20 grid gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle md:grid-cols-3">
          {COSTS.map(([n, title, text]) => (
            <div key={n} data-reveal className="bg-bg-primary p-7">
              <span className="t-label">{n}</span>
              <h3 className="mt-6 font-display text-2xl font-semibold tracking-[-0.03em]">{title}</h3>
              <p className="t-body mt-2">{text}</p>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
