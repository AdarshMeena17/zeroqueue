import { ArrowRight, Check } from 'lucide-react';
import { Button } from '../ui/Button';
import { Skeleton } from '../ui/Skeleton';
import { StatusIndicator } from './StatusIndicator';
import { TokenDisplay } from '../motion/TokenDisplay';
import { NumberChange } from '../motion/NumberChange';
import { cn } from '../../utils/cn';
import { formatToken } from '../../utils/format';

const RAIL_SEGMENTS = 12;

// Rail: one mark per person waiting (capped), with the serving point at the front.
function Rail({ waiting = 0, muted }) {
  const filled = Math.min(waiting, RAIL_SEGMENTS);
  return (
    <div className="flex items-center gap-1" aria-hidden="true">
      <span className="mr-1 h-2.5 w-2.5 rounded-full bg-signal" />
      {Array.from({ length: RAIL_SEGMENTS }, (_, i) => (
        <span
          key={i}
          style={{ transitionDelay: `${i * 18}ms` }}
          className={cn(
            'h-[3px] flex-1 rounded-full transition-transform duration-300 group-hover:translate-x-0.5',
            i < filled && !muted ? 'bg-text-primary/80' : 'bg-border-strong',
          )}
        />
      ))}
    </div>
  );
}

/**
 * QueueCard — one queue as a flow, not a box.
 * `status` is the backend QueueStatus (from GET /queues/:id/status or the queue:updated socket event);
 * without it the card shows only what GET /queues provides, and skeletons for the live numbers.
 */
export function QueueCard({
  queue,
  status,
  statusLoading = false,
  showLoad = true,
  joined = false,
  busy = false,
  done = false,
  actionLabel,
  onAction,
}) {
  const { name, department } = queue;
  const queueStatus = status?.status || queue.status;
  const isActive = queueStatus === 'active';
  const currentToken = status ? status.currentDisplayToken : queue.currentToken ? `${queue.prefix}-${queue.currentToken}` : null;
  const waiting = status?.waitingCount;
  const avg = status?.averageServiceTime ?? queue.averageServiceTime;
  const estWait = typeof waiting === 'number' && typeof avg === 'number' ? waiting * avg : null;

  let label = actionLabel || 'Join queue';
  if (joined) label = 'Open my queue';
  else if (!actionLabel && !isActive) label = queueStatus === 'paused' ? 'Paused' : 'Closed';
  const disabled = !joined && !actionLabel && !isActive;
  const staffView = Boolean(actionLabel); // operators see the waiting count, not a joiner's wait estimate

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-lg border border-border-subtle bg-bg-primary shadow-card transition-[transform,border-color] duration-300 hover:-translate-y-0.5 hover:border-border-strong">
      <span className="absolute inset-x-0 top-0 h-[2px] origin-left scale-x-0 bg-signal transition-transform duration-500 ease-out group-hover:scale-x-100" aria-hidden="true" />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="t-label truncate">{department?.name || 'Service'}</p>
          <StatusIndicator status={queueStatus} />
        </div>

        <h3 className="mt-2 font-display text-[1.35rem] font-semibold leading-tight tracking-[-0.03em]">{name}</h3>

        <div className="mt-6 flex items-end justify-between gap-4">
          <div>
            <p className="t-label mb-2">Now serving</p>
            <TokenDisplay value={formatToken(currentToken)} size="md" />
          </div>
          {showLoad && (
            <div className="text-right">
              <p className="t-label mb-2">{staffView ? 'Waiting' : 'Est. wait'}</p>
              {statusLoading && !status ? (
                <Skeleton className="ml-auto h-8 w-16" />
              ) : staffView ? (
                <span className="t-metric text-3xl">
                  <NumberChange value={typeof waiting === 'number' ? waiting : null} />
                </span>
              ) : estWait === null ? (
                <span className="t-metric text-3xl text-text-tertiary">—</span>
              ) : (
                <span className="t-metric text-3xl">
                  <NumberChange value={estWait} />
                  <span className="ml-1 text-sm font-normal text-text-tertiary">min</span>
                </span>
              )}
            </div>
          )}
        </div>

        {showLoad && (
          <div className="mt-6">
            <Rail waiting={waiting} muted={!isActive} />
            <div className="t-caption mt-2.5">
              {statusLoading && !status ? (
                <Skeleton className="h-3.5 w-28" />
              ) : typeof waiting === 'number' ? (
                <>
                  <span className="font-medium text-text-secondary">{waiting}</span> waiting
                  {isActive && !staffView && <span> · if you join now</span>}
                </>
              ) : (
                'Waiting count unavailable'
              )}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border-subtle p-3">
        <Button
          variant={joined ? 'outline' : 'primary'}
          className="w-full justify-between"
          disabled={disabled}
          isLoading={busy}
          onClick={() => onAction?.(queue)}
        >
          <span>{done ? 'Joined' : label}</span>
          {done ? <Check className="h-4 w-4" /> : !disabled && !busy && <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-0.5" />}
        </Button>
      </div>
    </article>
  );
}
