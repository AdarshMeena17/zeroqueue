import { useSearchParams } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { RefreshCw } from 'lucide-react';
import { useQueueOverview } from '../../hooks/useQueueOverview';
import { useJoinQueue } from '../../hooks/useJoinQueue';
import { QueueGrid } from '../../components/queue/QueueGrid';
import { Skeleton } from '../../components/ui/Skeleton';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { cn } from '../../utils/cn';

export default function UserQueues() {
  usePageTitle('Queues');
  const [params, setParams] = useSearchParams();
  const department = params.get('department');
  const { queues, departments, statuses, activeIds, loading, statusLoading, error, reload } = useQueueOverview();
  const { join, busyId, doneId } = useJoinQueue();

  const visible = department ? queues.filter((q) => q.department?._id === department) : queues;
  const select = (id) => setParams(id ? { department: id } : {});

  const chip = (active) =>
    cn(
      'min-h-11 rounded-md border px-4 py-2 text-sm font-medium transition-colors',
      active ? 'border-brand-accent bg-brand-accent text-brand-accent-text' : 'border-border-strong text-text-secondary hover:bg-bg-tertiary hover:text-text-primary',
    );

  return (
    <div className="space-y-10">
      <header>
        <p className="t-label">Services</p>
        <h1 className="t-page mt-3">Every open queue.</h1>
        <p className="t-lead mt-3 max-w-xl">Live counts and wait estimates, straight from the queue.</p>
      </header>

      {departments.length > 0 && (
        <div role="group" aria-label="Filter by department" className="flex flex-wrap gap-2">
          <button type="button" className={chip(!department)} aria-pressed={!department} onClick={() => select(null)}>
            All
          </button>
          {departments.map((d) => (
            <button key={d._id} type="button" className={chip(department === d._id)} aria-pressed={department === d._id} onClick={() => select(d._id)}>
              {d.name}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="We couldn't load queues"
          description={error}
          action={
            <Button variant="outline" onClick={reload}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          title={department ? 'No queues in this department' : 'No queues are open yet'}
          description={department ? 'Try another department, or view all queues.' : 'Queues appear here as soon as a department opens one.'}
          action={department && <Button variant="outline" onClick={() => select(null)}>View all queues</Button>}
        />
      ) : (
        <QueueGrid
          key={department || 'all'}
          queues={visible}
          statuses={statuses}
          activeIds={activeIds}
          statusLoading={statusLoading}
          join={join}
          busyId={busyId}
          doneId={doneId}
        />
      )}
    </div>
  );
}
