export interface WebSocketMessage {
    type: 'devices' | 'log' | 'heartbeat';
    data: any;
}
export declare function useWebSocket(onMessage: (message: WebSocketMessage) => void): {
    connect: () => void;
    disconnect: () => void;
};
//# sourceMappingURL=useWebSocket.d.ts.map