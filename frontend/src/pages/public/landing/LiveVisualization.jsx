import { useRef } from 'react';
import { gsap, useGSAP, prefersReducedMotion } from '../../../motion/gsap';
import { duration, ease } from '../../../motion/tokens';
import { TokenStrip, demoStats } from '../../../components/queue/TokenStrip';

const USER_TOKEN = 47;
const START = 41;

const CAPTIONS = [
  { at: 0, title: 'You join.', text: 'A token — A-047 — and your place in line, the moment you take it.' },
  { at: 43, title: 'The line moves.', text: 'Your position and estimated wait update as each person is served.' },
  { at: 45.2, title: 'Almost there.', text: 'Two people ahead. Time to head over.' },
  { at: 46.6, title: "You're not waiting blindly anymore.", text: 'Staff call A-047. Your screen tells you, loudly.' },
];

const captionIndex = (n) => CAPTIONS.reduce((acc, c, i) => (n >= c.at ? i : acc), 0);

// Signature moment: native scroll drives the queue. A sticky stage + a scrubbed tween on one number.
export default function LiveVisualization() {
  const root = useRef(null);
  const strip = useRef(null);

  useGSAP(
    () => {
      const el = (sel) => root.current.querySelector(sel);
      const caps = gsap.utils.toArray('[data-cap]', root.current);
      const reduced = prefersReducedMotion();
      const demo = { n: reduced ? USER_TOKEN : START };
      let shown = -1;

      const showCaption = (i) => {
        if (i === shown) return;
        const prev = caps[shown];
        shown = i;
        if (reduced) {
          caps.forEach((c, idx) => gsap.set(c, { opacity: idx === i ? 1 : 0 }));
          return;
        }
        if (prev) gsap.to(prev, { opacity: 0, y: -14, duration: duration.fast, ease: ease.out, overwrite: true });
        gsap.fromTo(caps[i], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: duration.normal, ease: ease.out, overwrite: true });
      };

      const draw = () => {
        strip.current?.render(demo.n);
        const s = demoStats(demo.n, USER_TOKEN);
        el('[data-v=position]').textContent = s.isTurn ? 'Now' : `#${s.position}`;
        el('[data-v=wait]').textContent = s.isTurn ? '0 min' : `${s.wait} min`;
        el('[data-v=ahead]').textContent = String(s.peopleAhead);
        el('[data-v=progress]').style.transform = `scaleX(${Math.min(1, (demo.n - START) / (USER_TOKEN - START))})`;
        showCaption(captionIndex(demo.n));
      };

      if (reduced) {
        caps.forEach((c) => gsap.set(c, { opacity: 0 }));
        draw();
        return;
      }

      caps.forEach((c) => gsap.set(c, { opacity: 0 }));
      draw();
      gsap.to(demo, {
        n: USER_TOKEN,
        ease: 'none',
        onUpdate: draw,
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom bottom', scrub: 0.6 },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="live" className="relative h-[330vh] border-t border-border-subtle motion-reduce:h-auto">
      <div className="sticky top-0 flex h-dvh flex-col justify-between overflow-hidden py-8 sm:py-12 motion-reduce:static motion-reduce:h-auto motion-reduce:gap-10 motion-reduce:py-24">
        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <p className="t-label">Live queue</p>
          <h2 className="t-section mt-4 max-w-2xl">Watch a queue move.</h2>
        </div>

        <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
          <div className="grain relative rounded-xl border border-border-subtle bg-bg-primary/70 p-3 shadow-card sm:p-6">
            <TokenStrip ref={strip} userToken={USER_TOKEN} initial={START} />
            <div className="mt-2 h-px w-full overflow-hidden bg-border-strong" aria-hidden="true">
              <div data-v="progress" className="h-full origin-left bg-signal" style={{ transform: 'scaleX(0)' }} />
            </div>
          </div>
        </div>

        <div className="mx-auto grid w-full max-w-7xl gap-8 px-5 sm:px-8 md:grid-cols-[1.4fr_1fr] md:items-end">
          <div className="relative min-h-[8.5rem] sm:min-h-[9.5rem]" aria-live="polite">
            {CAPTIONS.map((c, i) => (
              <div key={c.title} data-cap className="absolute inset-0">
                <p className="t-label">{`0${i + 1} / 04`}</p>
                <p className="t-section mt-3 text-[clamp(1.6rem,3.4vw,2.8rem)]">{c.title}</p>
                <p className="t-body mt-2 max-w-md">{c.text}</p>
              </div>
            ))}
          </div>

          <dl className="grid grid-cols-3 gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle">
            {[
              ['Position', 'position', '#6'],
              ['Ahead', 'ahead', '5'],
              ['Wait', 'wait', '25 min'],
            ].map(([label, key, initial]) => (
              <div key={key} className="bg-bg-primary px-3 py-3 sm:px-4">
                <dt className="t-label">{label}</dt>
                <dd data-v={key} className="t-metric mt-1.5 text-[clamp(1.25rem,2.4vw,1.9rem)]">
                  {initial}
                </dd>
              </div>
            ))}
          </dl>
        </div>
        <p className="t-caption mx-auto w-full max-w-7xl px-5 sm:px-8">Illustrative demo — tokens, counts and times are not live data. Scroll to advance the queue.</p>
      </div>
    </section>
  );
}
