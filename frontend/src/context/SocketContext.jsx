import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from './AuthContext';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

export const CONNECTION = {
  LIVE: 'live',
  SYNCING: 'syncing',
  RECONNECTING: 'reconnecting',
  OFFLINE: 'offline',
};

const SocketContext = createContext(null);

/**
 * Owns the single socket connection.
 * - connects when a user is authenticated, disconnects on logout
 * - tracks LIVE / SYNCING / RECONNECTING / OFFLINE from real socket events
 * - ref-counts queue-room subscriptions and re-joins them after every (re)connect
 * - runs registered resync callbacks (REST refetches) after every (re)connect
 */
export function SocketProvider({ children }) {
  const { user } = useAuth();
  const userId = user?._id;
  const [state, setState] = useState(CONNECTION.OFFLINE);
  const [error, setError] = useState(null);

  const rooms = useRef(new Map());
  const resyncs = useRef(new Set());

  const joinRoom = useCallback((queueId) => {
    const count = rooms.current.get(queueId) || 0;
    rooms.current.set(queueId, count + 1);
    const socket = getSocket();
    if (count === 0 && socket.connected) socket.emit('joinQueueRoom', { queueId });
  }, []);

  const leaveRoom = useCallback((queueId) => {
    const count = rooms.current.get(queueId) || 0;
    if (count <= 1) {
      rooms.current.delete(queueId);
      const socket = getSocket();
      if (socket.connected) socket.emit('leaveQueueRoom', { queueId });
    } else {
      rooms.current.set(queueId, count - 1);
    }
  }, []);

  const subscribe = useCallback((event, handler) => {
    const socket = getSocket();
    socket.on(event, handler);
    return () => socket.off(event, handler);
  }, []);

  const registerResync = useCallback((fn) => {
    resyncs.current.add(fn);
    return () => resyncs.current.delete(fn);
  }, []);

  // Connection lifecycle listeners: registered once, removed by reference.
  useEffect(() => {
    const socket = getSocket();
    const manager = socket.io;

    const runResync = async () => {
      setState(CONNECTION.SYNCING);
      await Promise.allSettled([...resyncs.current].map((fn) => Promise.resolve().then(fn)));
      if (socket.connected) setState(CONNECTION.LIVE);
    };

    const onConnect = () => {
      setError(null);
      rooms.current.forEach((_, queueId) => socket.emit('joinQueueRoom', { queueId }));
      runResync();
    };
    const onDisconnect = (reason) => {
      if (reason === 'io client disconnect') {
        setState(CONNECTION.OFFLINE);
        return;
      }
      setState(CONNECTION.RECONNECTING);
      // The server closed the connection: socket.io will not retry on its own.
      if (reason === 'io server disconnect') socket.connect();
    };
    const onConnectError = (err) => {
      setError(err?.message || 'Connection error');
      setState(socket.active ? CONNECTION.RECONNECTING : CONNECTION.OFFLINE);
    };
    const onReconnectAttempt = () => setState(CONNECTION.RECONNECTING);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('connect_error', onConnectError);
    manager.on('reconnect_attempt', onReconnectAttempt);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('connect_error', onConnectError);
      manager.off('reconnect_attempt', onReconnectAttempt);
    };
  }, []);

  // Connect while authenticated; tear down on logout.
  useEffect(() => {
    if (userId) {
      setState(CONNECTION.SYNCING);
      connectSocket();
    } else {
      rooms.current.clear();
      disconnectSocket();
      setState(CONNECTION.OFFLINE);
    }
  }, [userId]);

  // If the server denied the connection or the network came back, try again.
  useEffect(() => {
    if (!userId) return undefined;
    const retry = () => {
      if (document.visibilityState === 'hidden') return;
      const socket = getSocket();
      if (!socket.active) {
        setState(CONNECTION.SYNCING);
        socket.connect();
      }
    };
    window.addEventListener('online', retry);
    document.addEventListener('visibilitychange', retry);
    return () => {
      window.removeEventListener('online', retry);
      document.removeEventListener('visibilitychange', retry);
    };
  }, [userId]);

  const reconnect = useCallback(() => {
    if (userId) {
      setState(CONNECTION.SYNCING);
      connectSocket();
    }
  }, [userId]);

  const value = useMemo(
    () => ({ state, error, isLive: state === CONNECTION.LIVE, subscribe, joinRoom, leaveRoom, registerResync, reconnect }),
    [state, error, subscribe, joinRoom, leaveRoom, registerResync, reconnect],
  );

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used inside <SocketProvider>');
  return ctx;
}
