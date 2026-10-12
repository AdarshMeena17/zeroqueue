import { Link } from 'react-router-dom';
import { usePageTitle } from '../../hooks/usePageTitle';
import { useAdminData } from '../../hooks/useAdminData';
import { PageHeader } from '../../components/ui/PageHeader';
import { ErrorState } from '../../components/ui/ErrorState';
import { Skeleton } from '../../components/ui/Skeleton';
import { buttonClasses } from '../../components/ui/Button';

// Every figure is counted from GET /departments and GET /queues. Nothing is estimated.
export default function AdminDashboard() {
  usePageTitle('Admin overview');
  const { departments, queues, loading, error, reload } = useAdminData();

  const count = (status) => queues.filter((q) => q.status === status).length;
  const assignedStaff = new Set(departments.flatMap((d) => (d.staff || []).map((s) => String(s._id ?? s)))).size;
  const metrics = [
    ['Departments', departments.filter((d) => d.isActive).length, `${departments.filter((d) => !d.isActive).length} inactive`],
    ['Open queues', count('active'), `${count('paused')} paused · ${count('closed')} closed`],
    ['Assigned staff', assignedStaff, 'Staff placed in a department'],
  ];

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin" title="Overview" description="Departments and queues across the organization." />

      {error ? (
        <ErrorState title="We couldn’t load the overview" description={error} onRetry={reload} />
      ) : (
        <dl className="grid gap-px overflow-hidden rounded-lg border border-border-subtle bg-border-subtle sm:grid-cols-3">
          {metrics.map(([label, value, sub]) => (
            <div key={label} className="bg-bg-primary p-6">
              <dt className="t-label">{label}</dt>
              <dd className="mt-3">
                {loading ? <Skeleton className="h-10 w-16" /> : <span className="t-metric">{value}</span>}
                <p className="t-caption mt-2">{loading ? '\u00a0' : sub}</p>
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="flex flex-wrap gap-3">
        <Link to="/admin/departments" className={buttonClasses({ variant: 'outline' })}>Manage departments</Link>
        <Link to="/admin/queues" className={buttonClasses({ variant: 'outline' })}>Manage queues</Link>
      </div>
    </div>
  );
}
