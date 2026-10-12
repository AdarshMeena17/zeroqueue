import { cn } from '../../utils/cn';

const MAP = {
  active: { label: 'Open', dot: 'bg-signal text-signal', pulse: true },
  paused: { label: 'Paused', dot: 'bg-warn text-warn', pulse: false },
  closed: { label: 'Closed', dot: 'bg-danger text-danger', pulse: false },
};

export function StatusIndicator({ status, className }) {
  const s = MAP[status] || { label: status, dot: 'bg-text-tertiary text-text-tertiary', pulse: false };
  return (
    <span className={cn('inline-flex items-center gap-2 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-text-secondary', className)}>
      <span aria-hidden="true" className={cn('h-2 w-2 rounded-full', s.dot, s.pulse && 'animate-pulse-dot')} />
      {s.label}
    </span>
  );
}
