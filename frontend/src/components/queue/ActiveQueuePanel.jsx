import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { TokenDisplay } from '../motion/TokenDisplay';
import { NumberChange } from '../motion/NumberChange';
import { StatusIndicator } from './StatusIndicator';
import { buttonClasses } from '../ui/Button';
import { cn } from '../../utils/cn';
import { formatToken } from '../../utils/format';

function Metric({ label, children, className }) {
  return (
    <div className={cn('border-t border-white/10 pt-4', className)}>
      <p className="t-label !text-bone/55">{label}</p>
      <div className="mt-2">{children}</div>
    </div>
  );
}

// Dots for each person ahead of the user, then the user's own marker.
function AheadRail({ peopleAhead, serving }) {
  const shown = Math.min(peopleAhead, 10);
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className={cn('h-3 w-3 rounded-full', serving ? 'bg-ink' : 'bg-signal')} />
      {Array.from({ length: shown }, (_, i) => (
        <span key={i} className={cn('h-2 w-2 rounded-full', serving ? 'bg-ink/40' : 'bg-bone/35')} />
      ))}
      {peopleAhead > shown && <span className="text-[0.7rem] text-bone/55">+{peopleAhead - shown}</span>}
      <span className={cn('ml-1 rounded-sm px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.12em]', serving ? 'bg-ink text-signal' : 'bg-bone text-ink')}>
        You
      </span>
    </div>
  );
}

/**
 * The dominant dashboard object when the user is in a queue.
 * Every value comes from the backend: `entry` = GET my-entry (or user:queue:updated), `status` = GET status / queue:updated.
 */
export function ActiveQueuePanel({ queue, entry, status, dominant = true }) {
  const serving = entry.status === 'serving';
  const myToken = formatToken(entry.displayToken);
  const current = formatToken(status?.currentDisplayToken);

  return (
    <section
      aria-label={`Your active queue: ${queue.name}`}
      data-surface={serving ? 'signal' : 'dark'}
      className={cn(
        'grain relative overflow-hidden rounded-xl border',
        serving ? 'border-transparent bg-signal text-ink' : 'border-white/10 bg-obsidian text-bone',
      )}
    >
      {!serving && <div className="bg-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden="true" />}
      <div className={cn('relative grid gap-8 p-6 sm:p-8', dominant ? 'lg:grid-cols-[1.25fr_1fr] lg:p-10' : 'lg:grid-cols-[1fr_1fr]')}>
        <div className="flex min-w-0 flex-col">
          <div className="flex items-center justify-between gap-4">
            <p className={cn('t-label', serving ? '!text-ink/70' : '!text-bone/55')}>
              {queue.department?.name ? `${queue.department.name} · ` : ''}
              {queue.name}
            </p>
            <StatusIndicator status={status?.status || queue.status} className={serving ? '!text-ink' : '!text-bone/70'} />
          </div>

          <p className={cn('t-label mt-8', serving ? '!text-ink/70' : '!text-bone/55')}>{serving ? 'Your turn' : 'Your token'}</p>
          <TokenDisplay value={myToken} size={dominant ? 'xl' : 'lg'} className="mt-2" />

          <div className="mt-6">
            <AheadRail peopleAhead={entry.peopleAhead ?? 0} serving={serving} />
          </div>

          <div className="mt-8">
            <Link
              to={`/app/queues/${queue._id}`}
              className={buttonClasses({ variant: serving ? 'primary' : 'signal', size: 'lg', className: 'w-full sm:w-auto' })}
            >
              {serving ? 'Open — you are being served' : 'Open live queue'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 content-end gap-x-6 gap-y-5">
          <Metric label="Currently serving" className={serving ? '!border-ink/15' : ''}>
            <TokenDisplay value={current} size="md" />
          </Metric>
          <Metric label="Position" className={serving ? '!border-ink/15' : ''}>
            <span className="t-metric">
              {serving ? 'Now' : <NumberChange value={entry.position} prefix="#" />}
            </span>
          </Metric>
          <Metric label="People ahead" className={serving ? '!border-ink/15' : ''}>
            <span className="t-metric">
              <NumberChange value={entry.peopleAhead} />
            </span>
          </Metric>
          <Metric label="Estimated wait" className={serving ? '!border-ink/15' : ''}>
            <span className="t-metric">
              <NumberChange value={entry.estimatedWaitTime} />
              <span className={cn('ml-1 text-sm font-normal', serving ? 'text-ink/60' : 'text-bone/55')}>min</span>
            </span>
          </Metric>
        </div>
      </div>
    </section>
  );
}
