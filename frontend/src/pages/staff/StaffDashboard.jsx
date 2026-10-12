import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useAssignedQueues } from '../../hooks/useAssignedQueues';
import { QueueCard } from '../../components/queue/QueueCard';
import { Reveal } from '../../components/motion/Reveal';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Button } from '../../components/ui/Button';

export default function StaffDashboard() {
  usePageTitle('Your queues');
  const { user } = useAuth();
  const navigate = useNavigate();
  const { departments, queues, statuses, loading, error, reload } = useAssignedQueues();

  return (
    <div className="space-y-10">
      <header>
        <p className="t-label">Operations</p>
        <h1 className="t-page mt-3">Your queues.</h1>
        <p className="t-lead mt-3 max-w-xl">
          {user?.name ? `${user.name.split(' ')[0]}, these` : 'These'} are the queues in the departments you’re assigned to.
        </p>
      </header>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : error ? (
        <EmptyState
          title="We couldn’t load your assignments"
          description={error}
          action={
            <Button variant="outline" onClick={reload}>
              <RefreshCw className="h-4 w-4" /> Try again
            </Button>
          }
        />
      ) : departments.length === 0 ? (
        <EmptyState title="No department assigned" description="You’re not assigned to a department yet. An admin can assign you; your queues will appear here." />
      ) : queues.length === 0 ? (
        <EmptyState title="No queues to operate" description={`Your department${departments.length > 1 ? 's have' : ' has'} no open queues right now.`} />
      ) : (
        <Reveal stagger={0.06} className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {queues.map((q) => (
            <div key={q._id} data-reveal>
              <QueueCard
                queue={q}
                status={statuses[q._id]}
                statusLoading={!statuses[q._id]}
                actionLabel="Open console"
                onAction={() => navigate(`/staff/queues/${q._id}`)}
              />
            </div>
          ))}
        </Reveal>
      )}
    </div>
  );
}
