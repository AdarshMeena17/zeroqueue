import { Reveal } from '../../../components/motion/Reveal';

const ROWS = [
  ['Where am I?', 'Count the heads and hope.', 'An exact position, live.'],
  ['How long?', '“Soon.”', 'An estimate from people ahead and average service time.'],
  ['When am I up?', 'Listen for a number.', 'Your screen tells you it’s your turn.'],
  ['Who runs the line?', 'Whoever shouts loudest.', 'Staff with one clear control.'],
];

export default function Difference() {
  return (
    <section id="difference" className="border-t border-border-subtle py-28 sm:py-36">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <p className="t-label">The difference</p>
        <h2 className="t-section mt-5 max-w-3xl">Standing in line vs. knowing your place.</h2>

        <Reveal scroll stagger={0.08} className="mt-14 overflow-hidden rounded-lg border border-border-subtle">
          <div className="hidden grid-cols-[1fr_1.2fr_1.4fr] border-b border-border-subtle bg-bg-primary px-6 py-3 md:grid">
            <span />
            <span className="t-label">Standing in line</span>
            <span className="t-label !text-signal-ink">With QueueZero</span>
          </div>
          {ROWS.map(([q, a, b]) => (
            <div key={q} data-reveal className="grid gap-2 border-b border-border-subtle bg-bg-primary px-6 py-6 last:border-b-0 md:grid-cols-[1fr_1.2fr_1.4fr] md:items-baseline md:gap-6">
              <span className="font-display text-xl font-semibold tracking-[-0.03em]">{q}</span>
              <span className="text-text-tertiary line-through decoration-border-strong">{a}</span>
              <span className="font-medium">{b}</span>
            </div>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
