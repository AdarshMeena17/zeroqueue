import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/errors';
import { useQueueSocket } from './useQueueSocket';

const idOf = (v) => String(v?._id ?? v);

/**
 * Queues for the signed-in staff member.
 * GET /departments returns each department with `staff` populated; GET /queues returns queues with `department._id`.
 * A queue is shown only if its department lists this user in `staff`. If either request fails the hook reports an
 * error — it never falls back to "everything is assigned".
 */
export function useAssignedQueues() {
  const { user } = useAuth();
  const userId = user?._id;
  const [departments, setDepartments] = useState([]);
  const [queues, setQueues] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const alive = useRef(true);
  const idsRef = useRef([]);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const loadStatus = useCallback(async (id) => {
    try {
      const res = await api.get(`/queues/${id}/status`);
      if (alive.current) setStatuses((s) => ({ ...s, [id]: res.data.data }));
    } catch {
      /* the card still shows what GET /queues provides */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const [deptRes, queueRes] = await Promise.all([api.get('/departments'), api.get('/queues')]);
      if (!alive.current) return;
      const mine = new Set(
        (deptRes.data.data || []).filter((d) => (d.staff || []).some((s) => idOf(s) === String(userId))).map((d) => String(d._id)),
      );
      const assigned = (queueRes.data.data || []).filter((q) => q.department && mine.has(String(q.department._id)));
      idsRef.current = assigned.map((q) => q._id);
      setDepartments((deptRes.data.data || []).filter((d) => mine.has(String(d._id))));
      setQueues(assigned);
      setError(null);
      setLoading(false);
      await Promise.allSettled(assigned.map((q) => loadStatus(q._id)));
    } catch (err) {
      if (alive.current) {
        setError(getErrorMessage(err, 'Could not load your assigned queues.'));
        setLoading(false);
      }
    }
  }, [userId, loadStatus]);

  useEffect(() => {
    if (userId) load();
  }, [userId, load]);

  useQueueSocket(
    queues.map((q) => q._id),
    {
      'queue:updated': (p) => {
        if (p?.queueId) setStatuses((s) => ({ ...s, [p.queueId]: p }));
      },
      'queue:status:updated': ({ queueId, status } = {}) => {
        if (!queueId) return;
        setQueues((list) => list.map((q) => (q._id === queueId ? { ...q, status } : q)));
        setStatuses((s) => (s[queueId] ? { ...s, [queueId]: { ...s[queueId], status } } : s));
      },
    },
    () => Promise.allSettled(idsRef.current.map(loadStatus)),
  );

  return { departments, queues, statuses, loading, error, reload: load };
}
