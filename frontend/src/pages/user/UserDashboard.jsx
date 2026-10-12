import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ArrowRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useQueueOverview } from '../../hooks/useQueueOverview';
import { useJoinQueue } from '../../hooks/useJoinQueue';
import { ActiveQueuePanel } from '../../components/queue/ActiveQueuePanel';
import { QueueGrid } from '../../components/queue/QueueGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Reveal } from '../../components/motion/Reveal';
import { greeting, formatDateTime, ENTRY_STATUS, tokenFrom } from '../../utils/format';

function SectionHead({ eyebrow, title, action }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div>
        <p className="t-label">{eyebrow}</p>
        <h2 className="mt-1.5 font-display text-2xl font-semibold tracking-[-0.03em]">{title}</h2>
      </div>
      {action}
    </div>
  );
}

export default function UserDashboard() {
  usePageTitle('Dashboard');
  const { user } = useAuth();
  const overview = useQueueOverview();
  const { join, busyId, doneId } = useJoinQueue();
  const { queues, departments, statuses, entries, activeIds, recentActivity, loading, statusLoading, error, reload } = overview;

  const firstName = user?.name?.split(' ')[0] || 'there';
  const openCount = queues.filter((q) => (statuses[q._id]?.status || q.status) === 'active').length;
  const activeQueues = activeIds.map((id) => queues.find((q) => q._id === id)).filter(Boolean);

  if (loading) {
    return (
      <div className="space-y-10" aria-busy="true">
        <div className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-12 w-80 max-w-full" />
        </div>
        <Skeleton className="h-72 w-full rounded-xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        title="We couldn't load your queues"
        description={error}
        action={
          <Button variant="outline" onClick={reload}>
            <RefreshCw className="h-4 w-4" /> Try again
          </Button>
        }
      />
    );
  }

  const previewQueues = queues.filter((q) => !activeIds.includes(q._id)).slice(0, 3);
  const recent = recentActivity.slice(0, 5);

  return (
    <div className="space-y-14">
      <header>
        <p className="t-label">
          {new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <h1 className="t-page mt-3">
          {greeting()}, {firstName}.
        </h1>
        <p className="t-lead mt-3 max-w-xl">
          {activeQueues.length
            ? `You're in ${activeQueues.length === 1 ? 'a queue' : `${activeQueues.length} queues`} right now.`
            : openCount
              ? `${openCount} ${openCount === 1 ? 'queue is' : 'queues are'} open. Pick one and take your place.`
              : 'No queues are open right now.'}
        </p>
      </header>

      {activeQueues.length > 0 ? (
        <div className="space-y-4">
          {activeQueues.map((q, i) => (
            <Reveal key={q._id}>
              <ActiveQueuePanel queue={q} entry={entries[q._id]} status={statuses[q._id]} dominant={i === 0} />
            </Reveal>
          ))}
        </div>
      ) : (
        <Reveal className="flex flex-col gap-4 rounded-xl border border-dashed border-border-strong p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="font-display text-xl font-semibold tracking-tight">You're not in a queue.</p>
            <p className="t-meta mt-1">When you join one, your token, position and wait show up here first.</p>
          </div>
          <Link to="/app/queues" className="inline-flex items-center gap-2 text-sm font-medium underline decoration-signal decoration-2 underline-offset-[6px]">
            Browse queues <ArrowRight className="h-4 w-4" />
          </Link>
        </Reveal>
      )}

      {departments.length > 0 && (
        <section aria-labelledby="departments-heading">
          <SectionHead eyebrow="Departments" title={<span id="departments-heading">Where do you need to go?</span>} />
          <Reveal stagger={0.05} className="flex flex-wrap gap-2">
            {departments.map((d) => {
              const count = queues.filter((q) => q.department?._id === d._id).length;
              return (
                <Link
                  key={d._id}
                  data-reveal
                  to={`/app/queues?department=${d._id}`}
                  className="group inline-flex items-center gap-3 rounded-md border border-border-strong px-4 py-2.5 text-sm font-medium transition-colors hover:bg-bg-tertiary"
                >
                  {d.name}
                  <span className="rounded-sm bg-bg-tertiary px-1.5 py-0.5 text-xs tabular-nums text-text-secondary group-hover:bg-bg-primary">
                    {count}
                  </span>
                </Link>
              );
            })}
          </Reveal>
        </section>
      )}

      <section aria-labelledby="services-heading">
        <SectionHead
          eyebrow="Available services"
          title={<span id="services-heading">Join a queue</span>}
          action={
            queues.length > previewQueues.length && (
              <Link to="/app/queues" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
                All queues <ArrowRight className="h-4 w-4" />
              </Link>
            )
          }
        />
        {queues.length === 0 ? (
          <EmptyState title="No queues are open yet" description="Queues appear here as soon as a department opens one. Check back shortly." compact />
        ) : previewQueues.length === 0 ? (
          <p className="t-meta">You're already in every available queue.</p>
        ) : (
          <QueueGrid
            queues={previewQueues}
            statuses={statuses}
            activeIds={activeIds}
            statusLoading={statusLoading}
            join={join}
            busyId={busyId}
            doneId={doneId}
          />
        )}
      </section>

      <section aria-labelledby="activity-heading">
        <SectionHead
          eyebrow="Recent activity"
          title={<span id="activity-heading">Your latest tokens</span>}
          action={
            <Link to="/app/history" className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary">
              History <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
        {recent.length === 0 ? (
          <EmptyState compact title="No activity yet" description="Tokens you take will be listed here, newest first." />
        ) : (
          <Reveal as="ul" stagger={0.05} className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-bg-primary">
            {recent.map((e) => {
              const meta = ENTRY_STATUS[e.status] || { label: e.status, variant: 'default' };
              return (
                <li key={e._id} data-reveal className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold tabular-nums tracking-tight">{tokenFrom(e.queueRef.prefix, e.tokenNumber)}</p>
                    <p className="t-caption truncate">{e.queueRef.name}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-right">
                    <span className="t-caption hidden sm:block">{formatDateTime(e.joinedAt)}</span>
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                  </div>
                </li>
              );
            })}
          </Reveal>
        )}
      </section>
    </div>
  );
}
