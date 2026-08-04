import { io, Socket } from 'socket.io-client';

const rawUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const SOCKET_URL = rawUrl.replace(/\/api\/?$/, '');

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: {
        token: localStorage.getItem('token'),
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
  }
  return socket;
};

export const closeSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};