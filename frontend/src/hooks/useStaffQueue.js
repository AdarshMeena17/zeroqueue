import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { useQueueSocket } from './useQueueSocket';

const ACTION_LABEL = { next: 'call next', complete: 'complete', skip: 'skip', recall: 'recall' };

/**
 * Staff console state. GET /queues/:id/entries is the single source of truth for the list.
 *  - Refreshes are serialized: at most one request in flight, one queued behind it, so responses can never
 *    overwrite newer state out of order.
 *  - One staff action emits several socket events (queue:updated, queue:entry:updated, ...); a short debounce
 *    folds them into a single /entries refresh.
 *  - queue:entry:updated carries an unpopulated entry, so it only ever triggers a refresh.
 *  - Actions: click -> busy -> REST -> backend confirms -> authoritative refresh -> UI transition. No optimistic success.
 * phase: loading | ready | error | forbidden | notfound
 */
export function useStaffQueue(queueId) {
  const toast = useToast();
  const [phase, setPhase] = useState('loading');
  const [error, setError] = useState(null);
  const [queue, setQueue] = useState(null);
  const [entries, setEntries] = useState([]);
  const [busy, setBusy] = useState(null); // 'next' | 'complete' | 'skip' | 'recall' | null
  const [updatedAt, setUpdatedAt] = useState(null);

  const inflight = useRef(false);
  const queued = useRef(false);
  const timer = useRef(null);
  const hasData = useRef(false);
  const alive = useRef(true);
  const busyRef = useRef(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      clearTimeout(timer.current);
      waiters.current.forEach((resolve) => resolve());
      waiters.current = [];
    };
  }, []);

  // refresh() returns a promise that resolves when a fetch that started AFTER the call has finished,
  // so a caller (an action, a resync) can wait for state that is at least as new as its own request.
  const waiters = useRef([]);

  const run = useCallback(async () => {
    inflight.current = true;
    queued.current = false;
    const batch = waiters.current;
    waiters.current = [];
    try {
      const [qRes, eRes] = await Promise.all([api.get(`/queues/${queueId}`), api.get(`/queues/${queueId}/entries`)]);
      if (!alive.current) return;
      setQueue(qRes.data.data);
      setEntries(eRes.data.data || []);
      setUpdatedAt(new Date());
      setError(null);
      setPhase('ready');
      hasData.current = true;
    } catch (err) {
      if (!alive.current) return;
      const code = err?.response?.status;
      if (code === 403) setPhase('forbidden');
      else if (code === 404) setPhase('notfound');
      else if (!hasData.current) {
        setError(getErrorMessage(err, 'Could not load this queue.'));
        setPhase('error');
      }
      // else: keep the last good data; the connection indicator reflects the outage
    } finally {
      inflight.current = false;
      batch.forEach((resolve) => resolve());
      if (queued.current && alive.current) run();
    }
  }, [queueId]);

  const refresh = useCallback(
    () =>
      new Promise((resolve) => {
        waiters.current.push(resolve);
        if (inflight.current) {
          queued.current = true; // one follow-up fetch will serve everyone waiting
          return;
        }
        run();
      }),
    [run],
  );

  const scheduleRefresh = useCallback(() => {
    clearTimeout(timer.current);
    timer.current = setTimeout(refresh, 120);
  }, [refresh]);

  useEffect(() => {
    hasData.current = false;
    setPhase('loading');
    setEntries([]);
    setQueue(null);
    refresh();
  }, [refresh]);

  useQueueSocket(
    queueId,
    {
      'queue:updated': (payload) => {
        if (payload?.queue) return; // { queue } shape: queue:status:updated carries the status
        scheduleRefresh();
      },
      'queue:status:updated': (payload) => {
        if (payload?.status) setQueue((q) => (q ? { ...q, status: payload.status } : q));
      },
      'queue:entry:updated': scheduleRefresh,
      'queue:error': (payload) => toast.error(payload?.message || 'Live updates reported a problem.'),
    },
    refresh,
  );

  const perform = useCallback(
    async (action) => {
      if (busyRef.current) return false; // no duplicate requests
      busyRef.current = action;
      setBusy(action);
      try {
        await api.post(`/queues/${queueId}/${action}`);
        // Backend confirmed. Pull authoritative state before releasing the controls.
        clearTimeout(timer.current);
        await refresh();
        return true;
      } catch (err) {
        const code = err?.response?.status;
        let message = getErrorMessage(err, `Could not ${ACTION_LABEL[action]}.`);
        if (code === 401) message = 'Your session expired. Please sign in again.';
        if (code === 409) scheduleRefresh(); // state drifted (e.g. someone else acted): show the truth
        toast.error(message, { title: `Couldn't ${ACTION_LABEL[action]}` });
        return false;
      } finally {
        busyRef.current = null;
        if (alive.current) setBusy(null);
      }
    },
    [queueId, refresh, scheduleRefresh, toast],
  );

  const serving = entries.find((e) => e.status === 'serving') || null;
  const waiting = entries.filter((e) => e.status === 'waiting').sort((a, b) => a.tokenNumber - b.tokenNumber);
  const finished = entries.filter((e) => e.status !== 'waiting' && e.status !== 'serving');

  return { phase, error, queue, entries, serving, waiting, finished, busy, updatedAt, perform, reload: refresh };
}
