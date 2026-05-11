import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuthStore } from '../stores/auth.store';

let socketInstance = null;

export function useSocket(handlers = {}) {
  const { accessToken } = useAuthStore();
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!accessToken) return;

    if (!socketInstance) {
      socketInstance = io('/', {
        auth: { token: accessToken },
        transports: ['websocket'],
        reconnectionAttempts: 5,
      });
    }

    const socket = socketInstance;

    const registrados = [];
    for (const [evento, handler] of Object.entries(handlersRef.current)) {
      const fn = (data) => handler(data);
      socket.on(evento, fn);
      registrados.push([evento, fn]);
    }

    return () => {
      for (const [evento, fn] of registrados) {
        socket.off(evento, fn);
      }
    };
  }, [accessToken]);

  return socketInstance;
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
