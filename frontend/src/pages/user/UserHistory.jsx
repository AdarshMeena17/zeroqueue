import { RefreshCw } from 'lucide-react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useQueueOverview } from '../../hooks/useQueueOverview';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Reveal } from '../../components/motion/Reveal';
import { ENTRY_STATUS, formatDateTime, tokenFrom } from '../../utils/format';

// The backend only exposes history per queue (GET /queues/:id/my-history); there is no global history endpoint.
// This page lists the real per-queue entries it can read, newest first. Nothing is simulated.
export default function UserHistory() {
  usePageTitle('History');
  const { recentActivity, loading, error, reload } = useQueueOverview();

  return (
    <div className="space-y-10">
      <header>
        <p className="t-label">History</p>
        <h1 className="t-page mt-3">Your tokens, by queue.</h1>
        <p className="t-lead mt-3 max-w-xl">Every token you've taken in the queues you can access.</p>
      </header>

      {loading ? (
        <div className="space-y-3" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-16" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="We couldn't load your history"
          description={error}
          action={
            <Button variant="outline" onClick={reload}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          }
        />
      ) : recentActivity.length === 0 ? (
        <EmptyState title="No history yet" description="Once you join a queue, each token you take is recorded here with how it ended." />
      ) : (
        <Reveal as="ul" className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-bg-primary">
          {recentActivity.map((e) => {
            const meta = ENTRY_STATUS[e.status] || { label: e.status, variant: 'default' };
            return (
              <li key={e._id} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 sm:grid-cols-[8rem_1fr_auto_auto]">
                <p className="font-display text-xl font-semibold tabular-nums tracking-tight">{tokenFrom(e.queueRef.prefix, e.tokenNumber)}</p>
                <div className="col-span-2 row-start-2 min-w-0 sm:col-span-1 sm:row-start-1">
                  <p className="truncate text-sm font-medium">{e.queueRef.name}</p>
                  <p className="t-caption truncate">{e.queueRef.department?.name}</p>
                </div>
                <span className="t-caption hidden sm:block">{formatDateTime(e.joinedAt)}</span>
                <Badge variant={meta.variant} className="justify-self-end">
                  {meta.label}
                </Badge>
              </li>
            );
          })}
        </Reveal>
      )}
    </div>
  );
}
