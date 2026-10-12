import { useEffect, useState } from 'react';
import { Search, UserPlus, UsersRound, X } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { usePageTitle } from '../../hooks/usePageTitle';
import api from '../../services/api';
import { getErrorMessage } from '../../utils/errors';
import { Button } from '../../components/ui/Button';
import { EmptyState } from '../../components/ui/EmptyState';
import { ErrorState } from '../../components/ui/ErrorState';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';
import { Skeleton } from '../../components/ui/Skeleton';

export default function AdminStaff() {
  usePageTitle('Staff');
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState({});
  const [selectedDepartments, setSelectedDepartments] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');

  const normalizedSearch = search.trim().toLowerCase();
  const filteredUsers = users.filter((user) => (
    user.name.toLowerCase().includes(normalizedSearch)
    || user.email.toLowerCase().includes(normalizedSearch)
  ));

  useEffect(() => {
    let active = true;
    Promise.all([api.get('/users'), api.get('/departments')])
      .then(([usersResponse, departmentsResponse]) => {
        if (!active) return;
        const nextUsers = usersResponse.data.data || [];
        const nextDepartments = departmentsResponse.data.data || [];
        setUsers(nextUsers);
        setDepartments(nextDepartments);
        setSelectedRoles(Object.fromEntries(nextUsers.map((user) => [user._id, user.role])));
        setSelectedDepartments(Object.fromEntries(nextUsers.map((user) => [
          user._id,
          nextDepartments.find((department) => department.isActive && !department.staff?.some((staff) => String(staff._id ?? staff) === user._id))?._id || '',
        ])));
        setError(null);
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err, 'Could not load staff accounts.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  const reloadUsers = () => {
    setLoading(true);
    setReloadKey((key) => key + 1);
  };

  const handleRoleChange = async (user) => {
    const role = selectedRoles[user._id];
    if (!role || role === user.role) return;

    setUpdatingUserId(user._id);
    try {
      const response = await api.patch(`/users/${user._id}/role`, { role });
      const updatedUser = response.data.data;
      setUsers((current) => current.map((item) => (item._id === user._id ? updatedUser : item)));
      if (updatedUser.role !== 'staff') {
        setDepartments((current) => current.map((department) => ({
          ...department,
          staff: (department.staff || []).filter((staff) => String(staff._id ?? staff) !== user._id),
        })));
      }
      setSelectedRoles((current) => ({ ...current, [user._id]: updatedUser.role }));
      toast.success(`${user.name} is now ${updatedUser.role}.`);
    } catch (err) {
      setSelectedRoles((current) => ({ ...current, [user._id]: user.role }));
      toast.error(getErrorMessage(err, 'Could not update this account role.'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const assignedDepartments = (user) => departments.filter((department) => (
    department.staff?.some((staff) => String(staff._id ?? staff) === user._id)
  ));

  const handleDepartmentAssignment = async (user) => {
    const departmentId = selectedDepartments[user._id];
    if (!departmentId) return;

    setUpdatingUserId(user._id);
    try {
      await api.post(`/departments/${departmentId}/staff/${user._id}`);
      setDepartments((current) => current.map((department) => (
        department._id === departmentId
          ? { ...department, staff: [...(department.staff || []), { _id: user._id, name: user.name, email: user.email, role: 'staff' }] }
          : department
      )));
      const nextDepartment = departments.find((department) => (
        department.isActive
        && department._id !== departmentId
        && !department.staff?.some((staff) => String(staff._id ?? staff) === user._id)
      ));
      setSelectedDepartments((current) => ({ ...current, [user._id]: nextDepartment?._id || '' }));
      toast.success(`${user.name} assigned to ${departments.find((department) => department._id === departmentId)?.name}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not assign this staff member.'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDepartmentRemoval = async (user, department) => {
    setUpdatingUserId(user._id);
    try {
      await api.delete(`/departments/${department._id}/staff/${user._id}`);
      setDepartments((current) => current.map((item) => (
        item._id === department._id
          ? { ...item, staff: item.staff.filter((staff) => String(staff._id ?? staff) !== user._id) }
          : item
      )));
      setSelectedDepartments((current) => ({ ...current, [user._id]: department.isActive ? department._id : current[user._id] }));
      toast.success(`${user.name} removed from ${department.name}.`);
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove this staff assignment.'));
    } finally {
      setUpdatingUserId(null);
    }
  };

  return (
    <div className="space-y-10">
      <PageHeader eyebrow="Admin" title="Staff" description="Manage staff roles and assign staff to departments." />

      <section aria-label="User and staff accounts">
        {loading ? (
          <div className="space-y-2" aria-busy="true">
            {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[4.5rem]" />)}
          </div>
        ) : error ? (
          <ErrorState title="We couldn’t load staff accounts" description={error} onRetry={reloadUsers} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={UsersRound}
            compact
            title="No user accounts yet"
            description="Accounts will appear here after users register."
          />
        ) : (
          <div className="space-y-4">
            <Input
              label="Search users"
              type="search"
              placeholder="Search by name or email"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              trailing={<Search className="mr-2 h-4 w-4 text-text-tertiary" aria-hidden="true" />}
            />
            <p className="t-caption" aria-live="polite">
              Showing {filteredUsers.length} of {users.length} accounts
            </p>
            {filteredUsers.length === 0 ? (
              <EmptyState
                icon={Search}
                compact
                title="No matching accounts"
                description="Try a different name or email address."
              />
            ) : (
              <ul className="divide-y divide-border-subtle overflow-hidden rounded-lg border border-border-subtle bg-bg-primary">
                {filteredUsers.map((user) => (
                  <li key={user._id} className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{user.name}</p>
                      <p className="t-caption truncate">{user.email}</p>
                      {!user.isActive && <p className="mt-1 text-xs text-danger">Account inactive</p>}
                    </div>
                    <div className="flex w-full items-end gap-3 sm:w-auto">
                      <Select
                        label={`Role for ${user.name}`}
                        value={selectedRoles[user._id] || user.role}
                        onChange={(event) => setSelectedRoles((current) => ({ ...current, [user._id]: event.target.value }))}
                        disabled={updatingUserId !== null}
                        className="min-w-32"
                      >
                        <option value="user">User</option>
                        <option value="staff">Staff</option>
                      </Select>
                      <Button
                        size="sm"
                        isLoading={updatingUserId === user._id}
                        disabled={updatingUserId !== null || selectedRoles[user._id] === user.role}
                        onClick={() => handleRoleChange(user)}
                      >
                        Save
                      </Button>
                    </div>
                    {user.role === 'staff' && (
                      <div className="w-full border-t border-border-subtle pt-4">
                        <p className="t-label mb-3">Department assignments</p>
                        {assignedDepartments(user).length > 0 ? (
                          <ul className="mb-4 flex flex-wrap gap-2">
                            {assignedDepartments(user).map((department) => (
                              <li key={department._id} className="inline-flex items-center gap-2 rounded-sm border border-border-subtle bg-bg-secondary px-2.5 py-1.5 text-sm">
                                <span>{department.name}{!department.isActive ? ' (inactive)' : ''}</span>
                                <button
                                  type="button"
                                  aria-label={`Remove ${user.name} from ${department.name}`}
                                  className="text-text-tertiary hover:text-danger disabled:opacity-50"
                                  disabled={updatingUserId !== null}
                                  onClick={() => handleDepartmentRemoval(user, department)}
                                >
                                  <X className="h-4 w-4" aria-hidden="true" />
                                </button>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="t-caption mb-4">Not assigned to a department yet.</p>
                        )}
                        <div className="flex max-w-lg items-end gap-3">
                          <Select
                            label={`Assign ${user.name} to department`}
                            value={selectedDepartments[user._id] || ''}
                            onChange={(event) => setSelectedDepartments((current) => ({ ...current, [user._id]: event.target.value }))}
                            disabled={updatingUserId !== null}
                          >
                            <option value="">Choose a department</option>
                            {departments
                              .filter((department) => department.isActive && !assignedDepartments(user).some((assigned) => assigned._id === department._id))
                              .map((department) => <option key={department._id} value={department._id}>{department.name}</option>)}
                          </Select>
                          <Button
                            size="sm"
                            isLoading={updatingUserId === user._id}
                            disabled={updatingUserId !== null || !selectedDepartments[user._id]}
                            onClick={() => handleDepartmentAssignment(user)}
                          >
                            <UserPlus className="h-4 w-4" aria-hidden="true" /> Assign
                          </Button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <p className="t-caption mt-3">Admin accounts are managed outside this screen.</p>
      </section>
    </div>
  );
}
