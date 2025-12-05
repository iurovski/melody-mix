'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useParams } from 'next/navigation';
import { SongSearch } from '@/components/admin/SongSearch';
import { AdminQueue } from '@/components/admin/AdminQueue';
import { Song } from '@/types';

const AdminPage = () => {
    const params = useParams();
    const roomId = params?.sessionId as string;

    const { socket, isConnected } = useSocket();
    const [queue, setQueue] = useState<Song[]>([]);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [status, setStatus] = useState('Aguardando conexão...');
    type JoinRoomResponse = {
        success: boolean;
        error?: string;
        roomState?: {
            queue: Song[];
            currentSong: Song | null;
            isPerforming?: boolean;
        };
    };

    useEffect(() => {
        if (socket && isConnected && roomId) {
            socket.emit('join_room', roomId, (response: JoinRoomResponse) => {
                if (response.success && response.roomState) {
                    const { queue: stateQueue, currentSong: stateSong, isPerforming } = response.roomState;
                    setQueue(stateQueue);
                    if (stateSong && isPerforming) {
                        setCurrentSong(stateSong);
                        setIsPlaying(true);
                    } else {
                        setCurrentSong(null);
                        setIsPlaying(false);
                    }
                    setStatus('Conectado');
                } else {
                    setStatus(response.error || 'Sala não encontrada');
                }
            });
        }
    }, [socket, isConnected, roomId]);

    useEffect(() => {
        if (!socket) return;

        const handleQueueUpdated = (updatedQueue: Song[]) => setQueue(updatedQueue);
        const handleNowPlaying = (song: Song | null) => {
            setCurrentSong(song);
            setIsPlaying(true);
        };
        const handlePlayback = (action: 'play' | 'pause') => setIsPlaying(action === 'play');

        socket.on('queue_updated', handleQueueUpdated);
        socket.on('now_playing', handleNowPlaying);
        socket.on('playback_action', handlePlayback);

        return () => {
            socket.off('queue_updated', handleQueueUpdated);
            socket.off('now_playing', handleNowPlaying);
            socket.off('playback_action', handlePlayback);
        };
    }, [socket]);

    const handleControl = (action: 'play' | 'pause') => {
        if (socket && roomId) {
            if (action === 'play') {
                socket.emit('start_performance', { roomId });
            }
            socket.emit('control_playback', { roomId, action });
            setIsPlaying(action === 'play');
        }
    };

    const handleSkip = () => {
        if (socket && roomId) {
            socket.emit('play_next', { roomId });
        }
    };

    const handleStartPerformance = () => {
        if (socket && roomId) {
            socket.emit('start_performance', { roomId });
        }
    };

    const handleAddSong = (song: Omit<Song, 'uuid' | 'addedAt'>) => {
        if (socket && roomId) {
            socket.emit('add_to_queue', { roomId, song });
        }
    };

    const handleRemoveSong = (uuid: string) => {
        if (socket && roomId) {
            socket.emit('remove_from_queue', { roomId, songUuid: uuid });
        }
    };

    const handleMoveSong = (oldIndex: number, newIndex: number) => {
        if (socket && roomId) {
            socket.emit('move_in_queue', { roomId, oldIndex, newIndex });
        }
    };

    const handlePlayNow = (uuid: string) => {
        if (socket && roomId) {
            socket.emit('play_now', { roomId, songUuid: uuid }, () => {
                socket.emit('start_performance', { roomId });
            });
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-black via-gray-950 to-black text-white overflow-x-hidden">
            <header className="border-b border-white/10 px-4 md:px-10 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <p className="text-[var(--neon-blue)] text-xs uppercase tracking-[0.3em]">Controle Remoto</p>
                    <h1 className="text-3xl font-black tracking-tight">Melody Mix Admin</h1>
                    <p className="text-gray-400 text-sm">{status}</p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase">Sala</p>
                    <p className="font-mono text-lg text-[var(--neon-purple)]">{roomId}</p>
                    <span className={`inline-flex items-center gap-1 text-xs mt-1 px-2 py-1 rounded border ${isConnected ? 'border-green-500/40 text-green-400 bg-green-500/10' : 'border-red-500/40 text-red-400 bg-red-500/10'}`}>
                        <span className="text-lg leading-none">{isConnected ? '•' : '○'}</span>
                        {isConnected ? 'Online' : 'Offline'}
                    </span>
                </div>
            </header>

            <main className="p-4 md:p-8 lg:p-10 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
                <div className="space-y-4 lg:space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-purple-900/30">
                        <p className="text-xs text-gray-400 uppercase mb-2">Tocando agora</p>
                        {currentSong ? (
                            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                <img src={currentSong.thumbnail} alt={currentSong.title} className="w-24 h-16 object-cover rounded-xl border border-white/10" />
                                <div className="min-w-0">
                                    <p className="text-lg font-bold line-clamp-2 break-words">{currentSong.title}</p>
                                    <p className="text-sm text-[var(--neon-pink)]">Pedida por {currentSong.addedBy}</p>
                                </div>
                                <button
                                    onClick={handleStartPerformance}
                                    className="w-full sm:w-auto mt-2 sm:mt-0 px-4 py-2 bg-[var(--neon-purple)]/30 hover:bg-[var(--neon-purple)]/50 border border-[var(--neon-purple)]/60 rounded-xl text-sm font-bold"
                                >
                                    ▶ Iniciar música
                                </button>
                            </div>
                        ) : (
                            <p className="text-gray-500">Nenhuma música tocando.</p>
                        )}
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-purple-900/30">
                        <p className="text-xs text-gray-400 uppercase mb-3">Playback</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <button
                                onClick={() => handleControl('play')}
                                className={`py-3 rounded-xl font-bold border ${isPlaying ? 'bg-green-500/20 text-green-400 border-green-500/60' : 'bg-white/5 text-white border-white/10'}`}
                            >
                                ▶ Play
                            </button>
                            <button
                                onClick={() => handleControl('pause')}
                                className={`py-3 rounded-xl font-bold border ${!isPlaying ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/60' : 'bg-white/5 text-white border-white/10'}`}
                            >
                                ❚❚ Pause
                            </button>
                            <button
                                onClick={handleSkip}
                                className="py-3 rounded-xl font-bold border bg-red-600/20 text-red-300 border-red-500/60 hover:bg-red-600/30"
                            >
                                ⏭ Pular
                            </button>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl shadow-purple-900/30">
                        <SongSearch onAddSong={handleAddSong} roomId={roomId} />
                    </div>
                </div>

                <div className="min-h-[420px]">
                    <AdminQueue
                        queue={queue}
                        onRemove={handleRemoveSong}
                        onMove={handleMoveSong}
                        onPlayNow={handlePlayNow}
                    />
                </div>
            </main>
        </div>
    );
};

export default AdminPage;
