import { useEffect, useRef, useCallback } from 'react';
import type { WebSocketMessage } from '@shared/types.js';
import { useAppStore } from '../store/appStore.js';

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const { handleWebSocketMessage } = useAppStore();

  const connect = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const apiHost = import.meta.env.VITE_API_HOST || 'localhost';
    const apiPort = import.meta.env.VITE_API_PORT || '3001';
    const wsUrl = `${protocol}//${apiHost}:${apiPort}/ws`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      useAppStore.setState({ websocketConnected: true });
    };

    wsRef.current.onmessage = (event) => {
      try {
        const message: WebSocketMessage = JSON.parse(event.data);
        handleWebSocketMessage(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected, reconnecting...');
      useAppStore.setState({ websocketConnected: false });
      setTimeout(connect, 3000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
      useAppStore.setState({ websocketConnected: false });
    };
  }, [handleWebSocketMessage]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((message: unknown) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    sendMessage,
    isConnected: useAppStore((state) => state.websocketConnected),
  };
}
