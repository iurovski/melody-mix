'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { SongSearch } from '@/components/guest/SongSearch';
import { Song } from '@/types';

function AdminContent() {
    const searchParams = useSearchParams();
    const roomId = searchParams?.get('room');
    const { socket } = useSocket();

    const [activeTab, setActiveTab] = useState<'controls' | 'queue' | 'add'>('controls');
    const [queue, setQueue] = useState<Song[]>([]);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [restrictionMode, setRestrictionMode] = useState<'blacklist' | 'open'>('blacklist');

    type JoinRoomResponse = {
        success: boolean;
        error?: string;
        roomState?: {
            queue: Song[];
            currentSong: Song | null;
            isPerforming?: boolean;
            restrictionMode?: 'blacklist' | 'open';
        };
    };

    useEffect(() => {
        if (socket && roomId) {
            socket.emit('join_room', roomId, (response: JoinRoomResponse) => {
                if (response.success && response.roomState) {
                    const { queue: stateQueue, currentSong: stateSong, isPerforming, restrictionMode: mode } = response.roomState;
                    setQueue(stateQueue);
                    if (stateSong && isPerforming) {
                        setCurrentSong(stateSong);
                        setIsPlaying(true);
                    } else {
                        setCurrentSong(null);
                        setIsPlaying(false);
                    }
                    if (mode) setRestrictionMode(mode);
                } else {
                    alert('Erro ao entrar na sala: ' + response.error);
                }
            });

            socket.on('queue_updated', (updatedQueue: Song[]) => {
                setQueue(updatedQueue);
            });

            socket.on('now_playing', (song: Song | null) => {
                setCurrentSong(song);
                setIsPlaying(true);
            });

            socket.on('playback_action', (action: 'play' | 'pause') => {
                setIsPlaying(action === 'play');
            });
            socket.on('restriction_mode_changed', (mode: 'blacklist' | 'open') => setRestrictionMode(mode));

            return () => {
                socket.off('queue_updated');
                socket.off('now_playing');
                socket.off('playback_action');
                socket.off('restriction_mode_changed');
            };
        }
    }, [socket, roomId]);

    const handleControl = (action: 'play' | 'pause') => {
        if (socket && roomId) {
            socket.emit('control_playback', { roomId, action });
        }
    };

    const handleNext = () => {
        if (socket && roomId) {
            if (confirm('Pular música atual?')) {
                socket.emit('play_next', { roomId });
            }
        }
    };

    const handleRemove = (uuid: string) => {
        if (socket && roomId) {
            if (confirm('Remover esta música da fila?')) {
                socket.emit('remove_from_queue', { roomId, songUuid: uuid });
            }
        }
    };

    const handleAddSong = (song: Omit<Song, 'uuid' | 'addedAt'>) => {
        if (socket && roomId) {
            socket.emit('add_to_queue', { roomId, song });
            alert('Música adicionada com prioridade (simulado)!');
            setActiveTab('queue');
        }
    };

    if (!roomId) return <div className="text-white p-4">Sala não encontrada.</div>;

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <div className="bg-red-900/20 border-b border-red-500/20 p-4">
                <h1 className="text-xl font-bold text-red-500 text-center uppercase tracking-widest">Admin Control</h1>
            </div>

            {/* Now Playing */}
            {currentSong && (
                <div className="p-4 bg-white/5 border-b border-white/5">
                    <p className="text-xs text-gray-400 mb-2 text-center">TOCANDO AGORA</p>
                    <p className="font-bold text-center text-lg truncate">{currentSong.title}</p>
                </div>
            )}

            {/* Content */}
            <div className="p-4">
                {activeTab === 'controls' && (
                    <div className="space-y-6 mt-8">
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => handleControl('play')}
                                className={`p-6 rounded-xl font-bold text-xl ${isPlaying ? 'bg-green-500/20 text-green-500 border border-green-500' : 'bg-white/10 text-gray-400'}`}
                            >
                                PLAY
                            </button>
                            <button
                                onClick={() => handleControl('pause')}
                                className={`p-6 rounded-xl font-bold text-xl ${!isPlaying ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500' : 'bg-white/10 text-gray-400'}`}
                            >
                                PAUSE
                            </button>
                        </div>
                        <button
                            onClick={handleNext}
                            className="w-full p-6 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xl transition-colors"
                        >
                            PULAR MÚSICA ⏭
                        </button>
                    </div>
                )}

                {activeTab === 'queue' && (
                    <div className="space-y-3">
                        <h3 className="text-gray-400 text-sm uppercase mb-4">Gerenciar Fila ({queue.length})</h3>
                        {queue.map((song, index) => (
                            <div key={song.uuid} className="flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10">
                                <span className="text-gray-500 w-6">{index + 1}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{song.title}</p>
                                    <p className="text-xs text-gray-500">{song.addedBy}</p>
                                </div>
                                <button
                                    onClick={() => handleRemove(song.uuid)}
                                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg"
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                        {queue.length === 0 && <p className="text-center text-gray-500 mt-10">Fila vazia.</p>}
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="mt-4">
                        <SongSearch onAdd={handleAddSong} guestName="ADMIN" roomId={roomId || undefined} restrictionMode={restrictionMode} />
                    </div>
                )}
            </div>

            {/* Bottom Nav */}
            <div className="fixed bottom-0 left-0 w-full bg-black/90 backdrop-blur-md border-t border-white/10 flex justify-around p-4">
                <button
                    onClick={() => setActiveTab('controls')}
                    className={`text-sm font-bold ${activeTab === 'controls' ? 'text-red-500' : 'text-gray-500'}`}
                >
                    CONTROLES
                </button>
                <button
                    onClick={() => setActiveTab('queue')}
                    className={`text-sm font-bold ${activeTab === 'queue' ? 'text-red-500' : 'text-gray-500'}`}
                >
                    FILA
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`text-sm font-bold ${activeTab === 'add' ? 'text-red-500' : 'text-gray-500'}`}
                >
                    ADICIONAR
                </button>
            </div>
        </div>
    );
}

export default function AdminPage() {
    return (
        <Suspense fallback={<div className="text-white p-4">Carregando...</div>}>
            <AdminContent />
        </Suspense>
    );
}
