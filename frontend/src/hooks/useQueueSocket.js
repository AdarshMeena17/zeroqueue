import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

// The only server -> client events the backend defines (see backend/SOCKET_IO.md).
const EVENTS = ['queue:updated', 'queue:status:updated', 'queue:entry:updated', 'user:queue:updated', 'queue:error'];

/**
 * Subscribe a component to queue socket events.
 *
 * @param queueIds  a queue id, an array of ids, or null (only private `user:queue:updated` / listeners)
 * @param handlers  { [eventName]: (payload) => void } — always the latest handlers are called
 * @param onResync  async () => void — runs after every (re)connect so REST state can catch up
 */
export function useQueueSocket(queueIds, handlers = {}, onResync) {
  const { subscribe, joinRoom, leaveRoom, registerResync } = useSocket();

  const handlersRef = useRef(handlers);
  const resyncRef = useRef(onResync);
  useEffect(() => {
    handlersRef.current = handlers;
    resyncRef.current = onResync;
  });

  const key = Array.isArray(queueIds) ? [...new Set(queueIds.filter(Boolean))].sort().join(',') : queueIds || '';

  // Named handlers, removed by reference on cleanup.
  useEffect(() => {
    const offs = EVENTS.map((event) => subscribe(event, (payload) => handlersRef.current[event]?.(payload)));
    return () => offs.forEach((off) => off());
  }, [subscribe]);

  // Rooms are ref-counted by the provider and restored after reconnects.
  useEffect(() => {
    const ids = key ? key.split(',') : [];
    ids.forEach(joinRoom);
    return () => ids.forEach(leaveRoom);
  }, [key, joinRoom, leaveRoom]);

  useEffect(() => registerResync(() => resyncRef.current?.()), [registerResync]);
}
