import { useEffect, useRef, useCallback } from 'react';
export function useWebSocket(onMessage) {
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef();
    const connect = useCallback(() => {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            return;
        }
        const ws = new WebSocket('ws://localhost:3000');
        wsRef.current = ws;
        ws.onopen = () => {
            ws.send(JSON.stringify({ type: 'viewer' }));
        };
        ws.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                onMessage(message);
            }
            catch (error) {
                console.error('Failed to parse WebSocket message:', error);
            }
        };
        ws.onclose = () => {
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, 3000);
        };
        ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }, [onMessage]);
    const disconnect = useCallback(() => {
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }
        wsRef.current?.close();
        wsRef.current = null;
    }, []);
    useEffect(() => {
        connect();
        return () => {
            disconnect();
        };
    }, [connect, disconnect]);
    return { connect, disconnect };
}
