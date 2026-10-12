import { Check } from 'lucide-react';
import { Reveal } from '../../../components/motion/Reveal';
import { TokenDisplay } from '../../../components/motion/TokenDisplay';
import { cn } from '../../../utils/cn';

function Section({ id, eyebrow, title, intro, points, children, flip }) {
  return (
    <section id={id} className="border-t border-border-subtle py-28 sm:py-36">
      <div className={cn('mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2 lg:gap-24')}>
        <Reveal scroll stagger={0.08} className={flip ? 'lg:order-2' : ''}>
          <p data-reveal className="t-label">{eyebrow}</p>
          <h2 data-reveal className="t-section mt-5">{title}</h2>
          <p data-reveal className="t-lead mt-5 max-w-lg">{intro}</p>
          <ul className="mt-8 space-y-3.5">
            {points.map((p) => (
              <li key={p} data-reveal className="flex items-start gap-3 text-[0.95rem] text-text-secondary">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-signal-ink" aria-hidden="true" />
                {p}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal scroll y={36} className={flip ? 'lg:order-1' : ''}>{children}</Reveal>
      </div>
    </section>
  );
}

export function ForUsers() {
  return (
    <Section
      id="users"
      eyebrow="For people in line"
      title="Everything you need, at a glance."
      intro="Your token is the biggest thing on the screen. Everything else supports one question: when do I move?"
      points={[
        'Your token and your place in line, front and center',
        'People ahead and an estimated wait based on the queue’s average service time',
        'Updates arrive live — no refreshing',
        'Leave the queue whenever you need to',
      ]}
    >
      <div className="grain relative overflow-hidden rounded-xl border border-white/10 bg-obsidian p-7 text-bone sm:p-9">
        <div className="bg-grid pointer-events-none absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative">
          <p className="t-label !text-bone/65">Admissions · Your token</p>
          <TokenDisplay value="A-047" size="xl" className="mt-3" />
          <div className="mt-8 grid grid-cols-3 gap-6 border-t border-white/10 pt-5">
            {[['Serving', 'A-043'], ['Position', '#4'], ['Wait', '15 min']].map(([l, v]) => (
              <div key={l}>
                <p className="t-label !text-bone/65">{l}</p>
                <p className="t-metric mt-1.5 text-[clamp(1.4rem,2.6vw,2rem)]">{v}</p>
              </div>
            ))}
          </div>
          <p className="t-caption mt-6 !text-bone/65">Illustrative screen.</p>
        </div>
      </div>
    </Section>
  );
}

export function ForStaff() {
  const rows = [['#1', 'A-044'], ['#2', 'A-045'], ['#3', 'A-046'], ['#4', 'A-047']];
  return (
    <Section
      id="staff"
      flip
      eyebrow="For staff"
      title="One clear control for the line."
      intro="Staff see who is being served and who is waiting. Moving the line forward is a single, obvious action."
      points={[
        'Call next, complete, skip or recall — the four actions that run a queue',
        'The screen changes only after the server confirms the action',
        'The waiting list stays in order, with real names',
        'Admins can pause, resume or close a queue',
      ]}
    >
      <div className="overflow-hidden rounded-xl border border-border-subtle bg-bg-primary shadow-card">
        <div className="border-b border-border-subtle p-6 sm:p-7">
          <p className="t-label">Currently serving</p>
          <TokenDisplay value="A-043" size="xl" className="mt-2" />
        </div>
        <div className="grid grid-cols-2 gap-2 border-b border-border-subtle p-4 sm:grid-cols-4" aria-hidden="true">
          <span className="rounded-md bg-signal px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wider text-ink">Call next</span>
          {['Complete', 'Skip', 'Recall'].map((b) => (
            <span key={b} className="rounded-md border border-border-strong px-3 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-text-secondary">{b}</span>
          ))}
        </div>
        <ul className="divide-y divide-border-subtle">
          {rows.map(([pos, tok]) => (
            <li key={tok} className="flex items-center justify-between px-6 py-3.5 text-sm">
              <span className="t-label">{pos}</span>
              <span className="font-display text-lg font-semibold tabular-nums tracking-tight">{tok}</span>
            </li>
          ))}
        </ul>
        <p className="t-caption px-6 py-3">Illustrative screen.</p>
      </div>
    </Section>
  );
}
