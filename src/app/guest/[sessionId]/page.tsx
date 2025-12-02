'use client';

import React, { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useParams } from 'next/navigation';

const GuestPage = () => {
    const params = useParams();
    const sessionId = params?.sessionId as string;

    const { socket, isConnected } = useSocket();

    useEffect(() => {
        if (socket && isConnected && sessionId) {
            socket.emit('join_room', sessionId, (response: any) => {
                if (response.success) {
                    console.log('Joined room:', sessionId);
                } else {
                    console.error('Failed to join room:', response.error);
                }
            });
        }
    }, [socket, isConnected, sessionId]);

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 flex flex-col items-center">
            <h1 className="text-2xl font-bold mb-4">Melody Mix - Convidado</h1>
            <p className="mb-4">ID da Sessão: <span className="font-mono text-purple-400">{sessionId}</span></p>

            <div className="w-full max-w-md bg-gray-800 p-6 rounded-lg shadow-lg">
                <p className="text-center text-gray-400">Pesquise e peça músicas aqui...</p>
                {/* Future search component */}
            </div>
        </div>
    );
};

export default GuestPage;
