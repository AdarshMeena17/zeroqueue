import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../services/api';
import { useToast } from '../context/ToastContext';
import { getErrorMessage } from '../utils/errors';
import { useQueueSocket } from './useQueueSocket';

const TERMINAL = ['completed', 'skipped', 'cancelled'];
const INITIAL = { phase: 'loading', queue: null, status: null, entry: null, terminal: null, error: null, updatedAt: null };

/**
 * Authoritative live state for one queue as seen by the signed-in user.
 *   queue    GET /queues/:id            (name, prefix, department, status)
 *   status   GET /queues/:id/status     (currentDisplayToken, servingEntryId, waitingCount) + queue:updated
 *   entry    GET /queues/:id/my-entry   (displayToken, status, position, peopleAhead, estimatedWaitTime) + user:queue:updated
 * phase: loading | ready | error | notfound.  When `entry` is null in `ready`, `terminal` says how the last entry ended
 * (from GET my-history) or is null if the user has no entry here.
 *
 * Socket rules (backend payloads are ambiguous in places):
 *  - queue:updated may be QueueStatus-shaped or { queue } -> only the former is applied.
 *  - user:queue:updated is applied directly only when its entryId matches the open entry;
 *    every other variant (no entryId, other entry) is resolved by REST, never guessed.
 */
export function useLiveQueue(queueId) {
  const toast = useToast();
  const [state, setState] = useState(INITIAL);
  const stateRef = useRef(state);
  const seq = useRef(0);
  const syncTimer = useRef(null);

  useEffect(() => {
    stateRef.current = state;
  });

  const load = useCallback(
    async ({ silent = false } = {}) => {
      const ticket = ++seq.current;
      const [qRes, sRes, eRes] = await Promise.allSettled([
        api.get(`/queues/${queueId}`),
        api.get(`/queues/${queueId}/status`),
        api.get(`/queues/${queueId}/my-entry`),
      ]);
      if (ticket !== seq.current) return; // a newer load superseded this one

      const hasData = Boolean(stateRef.current.queue);
      const fail = (reason, fallback) => {
        if (silent && hasData) return; // keep last known state; the connection indicator tells the story
        setState((s) => ({ ...s, phase: 'error', error: getErrorMessage(reason, fallback) }));
      };

      if (qRes.status === 'rejected') {
        if (qRes.reason?.response?.status === 404) {
          setState((s) => ({ ...s, phase: 'notfound' }));
          return;
        }
        fail(qRes.reason, 'Could not load this queue.');
        return;
      }

      let entry = null;
      let terminal = null;
      if (eRes.status === 'fulfilled') {
        entry = eRes.value.data.data;
      } else if (eRes.reason?.response?.status === 404) {
        // Expected: no active entry. Find out how the last one ended.
        try {
          const history = await api.get(`/queues/${queueId}/my-history`);
          if (ticket !== seq.current) return;
          const latest = (history.data.data || [])[0];
          if (latest && TERMINAL.includes(latest.status)) terminal = { status: latest.status, tokenNumber: latest.tokenNumber };
        } catch {
          terminal = null;
        }
      } else {
        fail(eRes.reason, 'Could not load your place in this queue.');
        return;
      }

      setState((s) => ({
        phase: 'ready',
        error: null,
        queue: qRes.value.data.data,
        status: sRes.status === 'fulfilled' ? sRes.value.data.data : s.status,
        entry,
        terminal,
        updatedAt: new Date(),
      }));
    },
    [queueId],
  );

  useEffect(() => {
    setState(INITIAL);
    load();
    return () => {
      seq.current += 1; // drop in-flight responses for the previous queue
    };
  }, [load]);

  const syncSoon = useCallback(() => {
    clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => load({ silent: true }), 120);
  }, [load]);
  useEffect(() => () => clearTimeout(syncTimer.current), []);

  const sameQueue = (id) => !id || String(id) === String(queueId);

  useQueueSocket(
    queueId,
    {
      'queue:updated': (payload) => {
        if (!payload || payload.queue) return; // { queue } shape: status arrives via queue:status:updated
        if (!sameQueue(payload.queueId)) return;
        setState((s) => ({ ...s, status: { ...s.status, ...payload }, updatedAt: new Date() }));
      },
      'queue:status:updated': (payload) => {
        if (!payload || !sameQueue(payload.queueId)) return;
        setState((s) => ({
          ...s,
          queue: s.queue ? { ...s.queue, status: payload.status } : s.queue,
          status: s.status ? { ...s.status, status: payload.status } : s.status,
          updatedAt: new Date(),
        }));
      },
      'user:queue:updated': (payload) => {
        if (!sameQueue(payload?.queueId)) return;
        const current = stateRef.current.entry;
        if (payload?.entryId && current && String(payload.entryId) === String(current.entryId)) {
          setState((s) => ({ ...s, entry: { ...s.entry, ...payload }, terminal: null, updatedAt: new Date() }));
          return;
        }
        syncSoon(); // ambiguous (e.g. { status: 'completed' }): let REST decide
      },
      'queue:error': (payload) => toast.error(payload?.message || 'Live updates reported a problem.'),
    },
    () => load({ silent: true }),
  );

  const leave = useCallback(async () => {
    await api.post(`/queues/${queueId}/leave`);
    setState((s) => ({ ...s, entry: null, terminal: { status: 'cancelled', tokenNumber: s.entry?.tokenNumber }, updatedAt: new Date() }));
  }, [queueId]);

  const reload = useCallback(() => {
    setState((s) => ({ ...s, phase: 'loading', error: null }));
    load();
  }, [load]);

  return { ...state, reload, leave };
}
