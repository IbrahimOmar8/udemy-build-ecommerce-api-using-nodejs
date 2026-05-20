import { io, Socket } from 'socket.io-client';
import { tokenStore } from './api';

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_ORIGIN ||
  'http://localhost:8000';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (socket) return socket;
  socket = io(SOCKET_URL, {
    auth: { token: tokenStore.accessToken || '' },
    autoConnect: true,
    transports: ['websocket'],
  });
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
