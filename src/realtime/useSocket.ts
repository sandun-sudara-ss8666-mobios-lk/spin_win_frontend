import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getSocketConfig } from './socket-config';

export type SocketRoom = 'room:wheel' | 'room:qr-display' | 'room:staff-queue' | 'room:admin';

interface UseSocketOptions {
  room?: SocketRoom;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

// Module-level singleton to prevent duplicate connections and teardown storms
let sharedSocket: Socket | null = null;
let activeHookCount = 0;

function getSharedSocket(): Socket {
  // A disconnected socket may be reconnecting; replacing it loses its listeners.
  if (!sharedSocket) {
    const staffToken = localStorage.getItem('mobios_staff_token');
    const displayToken =
      localStorage.getItem('mobios_display_token') || 'mobios-display-screen-auth-token-key-2026';
    const token = staffToken || displayToken;

    const config = getSocketConfig(import.meta.env.VITE_SOCKET_URL);
    sharedSocket = io(config.url, {
      path: config.path,
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
  }
  return sharedSocket;
}

export function useSocket(options?: UseSocketOptions) {
  const [isConnected, setIsConnected] = useState(() => sharedSocket?.connected ?? false);
  const socketRef = useRef<Socket | null>(sharedSocket);
  const room = options?.room;

  useEffect(() => {
    activeHookCount++;
    const socket = getSharedSocket();
    socketRef.current = socket;
    setIsConnected(socket.connected);

    const handleConnect = () => {
      setIsConnected(true);
      if (room) {
        socket.emit('subscribe', { room });
      }
      options?.onConnect?.();
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      options?.onDisconnect?.();
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    if (socket.connected && room) {
      socket.emit('subscribe', { room });
    }

    return () => {
      activeHookCount--;
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      if (room) {
        socket.emit('unsubscribe', { room });
      }
      if (activeHookCount <= 0) {
        activeHookCount = 0;
        socket.disconnect();
        sharedSocket = null;
      }
    };
  }, [room]);

  const on = useCallback((eventName: string, handler: (...args: any[]) => void) => {
    const socket = socketRef.current || getSharedSocket();
    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, []);

  const emit = useCallback((eventName: string, ...args: any[]) => {
    const socket = socketRef.current || getSharedSocket();
    socket.emit(eventName, ...args);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    on,
    onEvent: on,
    emit,
  };
}
