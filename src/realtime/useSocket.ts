import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export type SocketRoom = 'room:wheel' | 'room:qr-display' | 'room:staff-queue' | 'room:admin';

interface UseSocketOptions {
  room?: SocketRoom;
  onConnect?: () => void;
  onDisconnect?: () => void;
}

export function useSocket(options?: UseSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const staffToken = localStorage.getItem('mobios_staff_token');
    const displayToken =
      localStorage.getItem('mobios_display_token') || 'mobios-display-screen-auth-token-key-2026';

    const token = staffToken || displayToken;

    // Connect to Socket.IO namespace /events
    const socket = io('/events', {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      if (options?.room) {
        socket.emit('subscribe', { room: options.room });
      }
      options?.onConnect?.();
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      options?.onDisconnect?.();
    });

    return () => {
      if (options?.room) {
        socket.emit('unsubscribe', { room: options.room });
      }
      socket.disconnect();
    };
  }, [options?.room]);

  const on = useCallback((eventName: string, handler: (...args: any[]) => void) => {
    const socket = socketRef.current;
    if (!socket) return () => {};

    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, []);

  const emit = useCallback((eventName: string, ...args: any[]) => {
    socketRef.current?.emit(eventName, ...args);
  }, []);

  return {
    socket: socketRef.current,
    isConnected,
    on,
    onEvent: on,
    emit,
  };
}
