import { CONNECTION, useSocket } from '../../context/SocketContext';
import { cn } from '../../utils/cn';

const MAP = {
  [CONNECTION.LIVE]: { label: 'Live', dot: 'bg-signal text-signal', pulse: true },
  [CONNECTION.SYNCING]: { label: 'Syncing', dot: 'bg-text-tertiary text-text-tertiary', pulse: true },
  [CONNECTION.RECONNECTING]: { label: 'Reconnecting', dot: 'bg-warn text-warn', pulse: true },
  [CONNECTION.OFFLINE]: { label: 'Offline', dot: 'bg-danger text-danger', pulse: false },
};

// Reflects the real socket state. It never claims LIVE unless the socket is connected and resynced.
export function ConnectionIndicator({ className }) {
  const { state, reconnect } = useSocket();
  const s = MAP[state];
  const content = (
    <>
      <span aria-hidden="true" className={cn('h-1.5 w-1.5 rounded-full', s.dot, s.pulse && 'animate-pulse-dot')} />
      {s.label}
    </>
  );
  const classes = cn(
    'inline-flex items-center gap-2 rounded-sm border border-border-subtle px-2.5 py-1 text-[0.6875rem] font-medium uppercase tracking-[0.14em] text-text-secondary',
    className,
  );

  return (
    <span role="status" aria-label={`Connection: ${s.label}`} className="inline-flex">
      {state === CONNECTION.OFFLINE ? (
        <button type="button" onClick={reconnect} className={cn(classes, 'transition-colors hover:text-text-primary')} title="Try to reconnect">
          {content}
        </button>
      ) : (
        <span className={classes}>{content}</span>
      )}
    </span>
  );
}
