'use client';

import React, { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useParams } from 'next/navigation';
import { SongSearch } from '@/components/admin/SongSearch';
import { AdminQueue } from '@/components/admin/AdminQueue';

const AdminPage = () => {
    const params = useParams();
    const sessionId = params?.sessionId as string;

    const { socket, isConnected } = useSocket();
    const [queue, setQueue] = React.useState<any[]>([]);

    useEffect(() => {
        if (socket && isConnected && sessionId) {
            socket.emit('join_room', sessionId, (response: any) => {
                if (response.success) {
                    console.log('Admin joined room:', sessionId);
                    if (response.roomState) {
                        setQueue(response.roomState.queue);
                    }
                } else {
                    console.error('Failed to join room:', response.error);
                }
            });
        }
    }, [socket, isConnected, sessionId]);

    useEffect(() => {
        if (!socket) return;

        socket.on('queue_updated', (updatedQueue: any[]) => {
            setQueue(updatedQueue);
        });

        return () => {
            socket.off('queue_updated');
        };
    }, [socket]);

    const handleAddSong = (song: any) => {
        if (socket && sessionId) {
            socket.emit('add_to_queue', { roomId: sessionId, song });
        }
    };

    const handleRemoveSong = (uuid: string) => {
        if (socket && sessionId) {
            socket.emit('remove_from_queue', { roomId: sessionId, songUuid: uuid });
        }
    };

    const handleMoveSong = (uuid: string, direction: 'up' | 'down') => {
        if (socket && sessionId) {
            socket.emit('move_in_queue', { roomId: sessionId, songUuid: uuid, direction });
        }
    };

    const handleSkip = () => {
        if (socket && sessionId) {
            socket.emit('play_next', { roomId: sessionId });
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4 md:p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-red-500">Melody Mix - Admin</h1>
                <div className="text-right">
                    <p className="text-sm text-gray-400">ID da Sessão</p>
                    <p className="font-mono text-xl font-bold">{sessionId}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-150px)]">
                <div className="flex flex-col gap-6">
                    {/* Controls */}
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h2 className="text-xl font-bold mb-4 text-white">Controles de Reprodução</h2>
                        <button
                            onClick={handleSkip}
                            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                            </svg>
                            Pular Música Atual
                        </button>
                    </div>

                    {/* Search */}
                    <div className="flex-1">
                        <SongSearch onAddSong={handleAddSong} />
                    </div>
                </div>

                {/* Queue */}
                <div className="h-full">
                    <AdminQueue queue={queue} onRemove={handleRemoveSong} onMove={handleMoveSong} />
                </div>
            </div>
        </div>
    );
};

export default AdminPage;
