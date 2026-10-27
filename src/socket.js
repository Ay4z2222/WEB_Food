import { io } from 'socket.io-client';

// Connect to backend: if in dev proxy or same origin, use current host or :3001
const URL = window.location.port === '5173' ? 'http://' + window.location.hostname + ':3001' : '/';

export const socket = io(URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
