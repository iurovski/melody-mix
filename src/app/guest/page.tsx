'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSocket } from '@/hooks/useSocket';
import { SongSearch } from '@/components/guest/SongSearch';
import { Song } from '@/types';

function GuestContent() {
    const searchParams = useSearchParams();
    const roomId = searchParams?.get('room');
    const { socket, isConnected } = useSocket();

    const [guestName, setGuestName] = useState('');
    const [hasJoined, setHasJoined] = useState(false);
    const [queue, setQueue] = useState<Song[]>([]);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);

    useEffect(() => {
        if (socket && roomId && hasJoined) {
            socket.emit('join_room', roomId, (response: any) => {
                if (response.success) {
                    setQueue(response.roomState.queue);
                    setCurrentSong(response.roomState.currentSong);
                } else {
                    alert('Erro ao entrar na sala: ' + response.error);
                }
            });

            socket.on('queue_updated', (updatedQueue: Song[]) => {
                setQueue(updatedQueue);
            });

            socket.on('now_playing', (song: Song | null) => {
                setCurrentSong(song);
            });

            return () => {
                socket.off('queue_updated');
                socket.off('now_playing');
            };
        }
    }, [socket, roomId, hasJoined]);

    const handleJoin = (e: React.FormEvent) => {
        e.preventDefault();
        if (guestName.trim()) {
            setHasJoined(true);
        }
    };

    const handleAddSong = (song: Omit<Song, 'uuid' | 'addedAt'>) => {
        if (socket && roomId) {
            socket.emit('add_to_queue', { roomId, song });
        }
    };

    if (!roomId) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
                <p className="text-center text-gray-400">
                    Escaneie o QR Code na tela do Host para entrar!
                </p>
            </div>
        );
    }

    if (!hasJoined) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <h1 className="text-3xl font-bold text-center mb-8 text-glow-blue">QUEM É VOCÊ?</h1>
                    <form onSubmit={handleJoin} className="space-y-4">
                        <input
                            type="text"
                            value={guestName}
                            onChange={(e) => setGuestName(e.target.value)}
                            placeholder="Seu nome ou apelido"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:border-[var(--neon-pink)] focus:outline-none text-white text-center text-lg"
                            required
                        />
                        <button
                            type="submit"
                            className="w-full py-3 bg-[var(--neon-pink)] text-white font-bold rounded-lg hover:bg-pink-600 transition-colors"
                        >
                            ENTRAR NA FESTA
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-black/80 backdrop-blur-md border-b border-white/10 p-4">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-glow-purple">MELODY MIX</h1>
                    <span className="text-xs text-[var(--neon-blue)] px-2 py-1 bg-white/5 rounded-full">
                        {guestName}
                    </span>
                </div>
            </div>

            {/* Now Playing */}
            {currentSong && (
                <div className="p-4 bg-gradient-to-r from-[var(--neon-purple)]/20 to-[var(--neon-blue)]/20 border-b border-white/5">
                    <p className="text-xs text-gray-400 mb-1 uppercase tracking-wider">Tocando Agora</p>
                    <div className="flex items-center gap-3">
                        <img src={currentSong.thumbnail} className="w-12 h-12 rounded object-cover" />
                        <div className="min-w-0">
                            <p className="font-bold truncate text-sm">{currentSong.title}</p>
                            <p className="text-xs text-[var(--neon-pink)]">Pedida por: {currentSong.addedBy}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="p-4">
                <SongSearch onAdd={handleAddSong} guestName={guestName} />
            </div>

            {/* My Queue Status */}
            <div className="px-4 mt-4">
                <h3 className="text-[var(--neon-blue)] font-bold mb-3 text-sm uppercase">Fila da Festa ({queue.length})</h3>
                <div className="space-y-2">
                    {queue.map((song, index) => (
                        <div
                            key={song.uuid}
                            className={`flex items-center gap-3 p-3 rounded-lg border ${song.addedBy === guestName
                                ? 'bg-[var(--neon-purple)]/10 border-[var(--neon-purple)]'
                                : 'bg-white/5 border-transparent'
                                }`}
                        >
                            <span className="text-gray-500 font-mono text-sm w-5">{index + 1}</span>
                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${song.addedBy === guestName ? 'text-[var(--neon-purple)]' : 'text-gray-300'}`}>
                                    {song.title}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {song.addedBy === guestName ? 'Você' : song.addedBy}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function GuestPage() {
    return (
        <Suspense fallback={<div className="text-white p-4">Carregando...</div>}>
            <GuestContent />
        </Suspense>
    );
}
