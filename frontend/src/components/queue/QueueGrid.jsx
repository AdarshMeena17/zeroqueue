import { useNavigate } from 'react-router-dom';
import { QueueCard } from './QueueCard';
import { Reveal } from '../motion/Reveal';

// Renders the user's queue catalogue with live status and the real join flow.
export function QueueGrid({ queues, statuses, activeIds, statusLoading, join, busyId, doneId, className }) {
  const navigate = useNavigate();
  return (
    <Reveal stagger={0.06} className={className || 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'}>
      {queues.map((q) => {
        const joined = activeIds.includes(q._id);
        return (
          <div key={q._id} data-reveal>
            <QueueCard
              queue={q}
              status={statuses[q._id]}
              statusLoading={statusLoading}
              joined={joined}
              busy={busyId === q._id}
              done={doneId === q._id}
              onAction={joined ? () => navigate(`/app/queues/${q._id}`) : join}
            />
          </div>
        );
      })}
    </Reveal>
  );
}
