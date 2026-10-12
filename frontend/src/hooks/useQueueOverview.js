import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import api from '../services/api';
import { getErrorMessage } from '../utils/errors';
import { useQueueSocket } from './useQueueSocket';

const ACTIVE = ['waiting', 'serving'];

/**
 * Everything the user-facing screens need, from real endpoints only:
 *  GET /departments, GET /queues            -> catalogue
 *  GET /queues/:id/status                   -> waitingCount, currentDisplayToken (per queue)
 *  GET /queues/:id/my-history               -> the user's entries in that queue (active ones are waiting|serving)
 *  GET /queues/:id/my-entry                 -> position / peopleAhead / estimatedWaitTime for an active entry
 * Live: queue:updated (QueueStatus shape), queue:status:updated, user:queue:updated.
 * Backend limitation: no global "my active queues" endpoint, so history is read per queue.
 */
export function useQueueOverview() {
  const [departments, setDepartments] = useState([]);
  const [queues, setQueues] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [histories, setHistories] = useState({}); // queueId -> entries[]
  const [entries, setEntries] = useState({}); // queueId -> my-entry payload (active only)
  const [loading, setLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [error, setError] = useState(null);

  const alive = useRef(true);
  const queueIdsRef = useRef([]);
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
      /* card keeps showing the data from GET /queues */
    }
  }, []);

  const loadMine = useCallback(async (id) => {
    let history = [];
    try {
      const res = await api.get(`/queues/${id}/my-history`);
      history = res.data.data || [];
    } catch {
      return;
    }
    const isActive = history.some((e) => ACTIVE.includes(e.status));
    let entry = null;
    if (isActive) {
      try {
        entry = (await api.get(`/queues/${id}/my-entry`)).data.data;
      } catch {
        entry = null; // 404 -> no longer active
      }
    }
    if (!alive.current) return;
    setHistories((h) => ({ ...h, [id]: history }));
    setEntries((e) => {
      const next = { ...e };
      if (entry) next[id] = entry;
      else delete next[id];
      return next;
    });
  }, []);

  const loadAll = useCallback(async () => {
    try {
      const [deptRes, queueRes] = await Promise.all([api.get('/departments'), api.get('/queues')]);
      if (!alive.current) return;
      const list = queueRes.data.data || [];
      queueIdsRef.current = list.map((q) => q._id);
      setDepartments(deptRes.data.data || []);
      setQueues(list);
      setError(null);
      setLoading(false);
      await Promise.allSettled(list.flatMap((q) => [loadStatus(q._id), loadMine(q._id)]));
    } catch (err) {
      if (alive.current) {
        setError(getErrorMessage(err, 'Could not load queues.'));
        setLoading(false);
      }
    } finally {
      if (alive.current) setStatusLoading(false);
    }
  }, [loadMine, loadStatus]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refreshMine = useCallback(
    (ids) => Promise.allSettled([...new Set(ids)].map((id) => loadMine(id))),
    [loadMine],
  );

  const activeIds = useMemo(() => Object.keys(entries), [entries]);
  const activeIdsRef = useRef(activeIds);
  useEffect(() => {
    activeIdsRef.current = activeIds;
  }, [activeIds]);

  // Debounced so one server action (several socket events) causes one refetch.
  const debounce = useRef(null);
  useEffect(() => () => clearTimeout(debounce.current), []);

  useQueueSocket(
    queues.filter((q) => q.status !== 'closed').map((q) => q._id),
    {
      // Only the QueueStatus shape carries queueId. Pause/resume/close also emit queue:updated as { queue }, handled below.
      'queue:updated': (payload) => {
        if (payload?.queueId) setStatuses((s) => ({ ...s, [payload.queueId]: payload }));
      },
      'queue:status:updated': ({ queueId, status } = {}) => {
        if (!queueId) return;
        setQueues((list) => list.map((q) => (q._id === queueId ? { ...q, status } : q)));
        setStatuses((s) => (s[queueId] ? { ...s, [queueId]: { ...s[queueId], status } } : s));
      },
      // Payloads are not scoped to a queue (backend limitation) -> let REST decide what changed.
      'user:queue:updated': (payload) => {
        clearTimeout(debounce.current);
        debounce.current = setTimeout(() => {
          refreshMine([...activeIdsRef.current, ...(payload?.queueId ? [payload.queueId] : [])]);
        }, 150);
      },
    },
    async () => {
      await Promise.allSettled([
        ...queueIdsRef.current.map((id) => loadStatus(id)),
        refreshMine([...activeIdsRef.current]),
      ]);
    },
  );

  const recentActivity = useMemo(() => {
    const byId = Object.fromEntries(queues.map((q) => [q._id, q]));
    return Object.entries(histories)
      .flatMap(([qid, list]) => list.map((e) => ({ ...e, queueRef: byId[qid] })))
      .filter((e) => e.queueRef)
      .sort((a, b) => new Date(b.joinedAt) - new Date(a.joinedAt));
  }, [histories, queues]);

  return {
    departments,
    queues,
    statuses,
    entries,
    activeIds,
    recentActivity,
    loading,
    statusLoading,
    error,
    reload: loadAll,
    refreshMine,
  };
}
