import { useState } from 'react';
import { usePageTitle } from '../../hooks/usePageTitle';
import { Building2, Plus, Trash2 } from 'lucide-react';
import api from '../../services/api';
import { useAdminData } from '../../hooks/useAdminData';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils/errors';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AdminDepartments() {
  usePageTitle('Departments');
  const toast = useToast();
  const { departments, loading, error, reload } = useAdminData();
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [pending, setPending] = useState(null); // department being deactivated
  const [deactivating, setDeactivating] = useState(false);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.post('/departments', { name: name.trim() });
      toast.success(`Department “${name.trim()}” created.`);
      setName('');
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create department.'));
    } finally {
      setCreating(false);
    }
  };

  const confirmDeactivate = async () => {
    setDeactivating(true);
    try {
      await api.delete(`/departments/${pending._id}`);
      toast.success(`${pending.name} deactivated.`);
      reload();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to deactivate department.'));
    } finally {
      setDeactivating(false);
      setPending(null);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin" title="Departments" description="Group queues and assign the staff who run them." />

      <div className="grid gap-8 lg:grid-cols-[20rem_1fr]">
        <form onSubmit={handleCreate} className="h-fit space-y-4 rounded-lg border border-border-subtle bg-bg-primary p-5">
          <h2 className="font-display text-lg font-semibold tracking-tight">New department</h2>
          <Input label="Name" placeholder="e.g. Student Services" value={name} onChange={(e) => setName(e.target.value)} required />
          <Button type="submit" className="w-full" isLoading={creating}>
            <Plus className="h-4 w-4" aria-hidden="true" /> Add department
          </Button>
        </form>

        <section aria-label="Departments">
          {loading ? (
            <div className="space-y-2" aria-busy="true">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[4.5rem]" />)}
            </div>
          ) : error ? (
            <ErrorState title="We couldn’t load departments" description={error} onRetry={reload} />
          ) : departments.length === 0 ? (
            <EmptyState icon={Building2} compact title="No departments yet" description="Create the first one to start adding queues." />
          ) : (
            <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-bg-primary">
              {departments.map((d) => (
                <li key={d._id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{d.name}</p>
                    <p className="t-caption">{d.staff?.length || 0} assigned staff</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={d.isActive ? 'active' : 'closed'}>{d.isActive ? 'Active' : 'Inactive'}</Badge>
                    {d.isActive && (
                      <Button variant="danger-ghost" size="sm" onClick={() => setPending(d)}>
                        <Trash2 className="h-4 w-4" aria-hidden="true" /> Deactivate
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
        open={Boolean(pending)}
        destructive
        loading={deactivating}
        title={`Deactivate ${pending?.name || 'this department'}?`}
        description="The department is hidden from users and staff. Its queues themselves are not changed by this action."
        confirmLabel="Deactivate department"
        onCancel={() => setPending(null)}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}
