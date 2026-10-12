import { useEffect, useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { ListOrdered, Pause, Play, Plus, Power } from 'lucide-react';
import api from '../../services/api';
import { useAdminData } from '../../hooks/useAdminData';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { StatusIndicator } from '../../components/queue/StatusIndicator';

export default function AdminQueues() {
  usePageTitle('Queues');
  const toast = useToast();
  const { departments, queues, loading, error, reload } = useAdminData();
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [creating, setCreating] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [closing, setClosing] = useState(null); // queue pending close confirmation

  const activeDepartments = departments.filter((d) => d.isActive);
  useEffect(() => {
    if (!departmentId && activeDepartments.length) setDepartmentId(activeDepartments[0]._id);
  }, [activeDepartments, departmentId]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/queues', { name: name.trim(), prefix, departmentId });
      toast.success(`Queue “${name.trim()}” created.`);
      setName('');
      setPrefix('');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create queue.'));
    } finally {
      setCreating(false);
    }
  };

  // pause / resume / close are admin-only endpoints; the backend stays the authority.
  const changeStatus = async (queue, action) => {
    setBusyId(queue._id);
    try {
      await api.post(`/queues/${queue._id}/${action}`);
      toast.success(`${queue.name} ${action === 'pause' ? 'paused' : action === 'resume' ? 'resumed' : 'closed'}.`);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err, `Could not ${action} this queue.`));
    } finally {
      setBusyId(null);
      setClosing(null);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin" title="Queues" description="Create queues and control whether they are open." />

      <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
        <form onSubmit={handleCreate} className="h-fit space-y-4 rounded-lg border border-border-subtle bg-bg-primary p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">New queue</h2>
          <Select label="Department" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required disabled={!activeDepartments.length}>
            {activeDepartments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </Select>
          <Input label="Queue name" placeholder="e.g. Registration" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input
            label="Prefix"
            hint="Up to 4 letters shown before the token number, e.g. REG-12"
            placeholder="REG"
            value={prefix}
            onChange={(e) => setPrefix(e.target.value.toUpperCase())}
            maxLength={4}
            required
          />
          <Button type="submit" className="w-full" isLoading={creating} disabled={!activeDepartments.length}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add queue
          </Button>
          {!loading && !activeDepartments.length && <p className="t-caption">Create an active department first.</p>}
        </form>

        <section aria-label="Queues">
          {loading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
            </div>
          ) : error ? (
            <ErrorState title="We couldn’t load queues" description={error} onRetry={reload} />
          ) : queues.length === 0 ? (
            <EmptyState icon={ListOrdered} compact title="No queues yet" description="Create a queue to let people start joining." />
          ) : (
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-bg-primary">
              {queues.map((q) => (
                <li key={q._id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:p-5">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="grid h-12 w-14 shrink-0 place-items-center rounded-md border border-border-strong font-display text-base font-semibold tracking-tight">
                      {q.prefix}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-medium">{q.name}</p>
                      <p className="t-caption truncate">{q.department?.name || 'Unknown department'}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusIndicator status={q.status} className="mr-2" />
                    {q.status === 'active' && (
                      <Button variant="outline" size="sm" disabled={busyId === q._id} onClick={() => changeStatus(q, 'pause')}>
                        <Pause className="h-4 w-4" aria-hidden="true" /> Pause
                      </Button>
                    )}
                    {q.status === 'paused' && (
                      <Button variant="outline" size="sm" disabled={busyId === q._id} onClick={() => changeStatus(q, 'resume')}>
                        <Play className="h-4 w-4" aria-hidden="true" /> Resume
                      </Button>
                    )}
                    {q.status !== 'closed' && (
                      <Button variant="danger-ghost" size="sm" disabled={busyId === q._id} onClick={() => setClosing(q)}>
                        <Power className="h-4 w-4" aria-hidden="true" /> Close
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(closing)}
        destructive
        loading={Boolean(closing) && busyId === closing?._id}
        title={`Close ${closing?.name || 'this queue'}?`}
        description="Closing is permanent. A closed queue can’t be reopened, nobody can join or be called, and it is hidden from users and staff. Pause it instead if you only need a break."
        confirmLabel="Close queue permanently"
        onCancel={() => setClosing(null)}
        onConfirm={() => changeStatus(closing, 'close')}
      />
    </div>
  );
}
