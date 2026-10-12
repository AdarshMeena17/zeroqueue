import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

// The one and only Socket.IO client. Created lazily, never connected until
// SocketProvider asks for it (the backend authenticates via the HTTP-only cookie).
let socket = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: false,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return socket;
};

export const connectSocket = () => {
  const s = getSocket();
  // `active` is false when never started, manually disconnected, or denied by server middleware.
  if (!s.active) s.connect();
  return s;
};

export const disconnectSocket = () => {
  if (socket) socket.disconnect();
};
