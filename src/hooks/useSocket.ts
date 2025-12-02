import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

declare global {
    interface Window {
        socket: Socket | undefined;
    }
}

export const useSocket = () => {
    const [isConnected, setIsConnected] = useState(false);
    const [socket, setSocket] = useState<Socket | null>(null);

    useEffect(() => {
        const initSocket = async () => {
            if (!window.socket) {
                await fetch('/api/socket');

                window.socket = io({
                    path: '/api/socket-io',
                    addTrailingSlash: false,
                    // No forced transport, let it negotiate
                });
            }

            const socketInstance = window.socket;
            setSocket(socketInstance);

            if (socketInstance.connected) {
                setIsConnected(true);
            }

            const onConnect = () => {
                console.log('Socket connected:', socketInstance.id);
                setIsConnected(true);
            };

            const onDisconnect = (reason: string) => {
                console.log('Socket disconnected:', reason);
                setIsConnected(false);
            };

            const onConnectError = (error: Error) => {
                console.log('Socket connect error:', error);
                setIsConnected(false);
            };

            socketInstance.on('connect', onConnect);
            socketInstance.on('disconnect', onDisconnect);
            socketInstance.on('connect_error', onConnectError);

            return () => {
                socketInstance.off('connect', onConnect);
                socketInstance.off('disconnect', onDisconnect);
                socketInstance.off('connect_error', onConnectError);
            };
        };

        initSocket();
    }, []);

    return { socket, isConnected };
};
