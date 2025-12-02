'use client';

import React, { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { VideoPlayer } from '@/components/host/VideoPlayer';
import { HostControls } from '@/components/host/HostControls';
import { Song } from '@/types';
import { QRCodeSVG } from 'qrcode.react';

export default function HostPage() {
    const { socket, isConnected } = useSocket();
    const [roomName, setRoomName] = useState('');
    const [roomId, setRoomId] = useState('');
    const [queue, setQueue] = useState<Song[]>([]);
    const [currentSong, setCurrentSong] = useState<Song | null>(null);
    const [isPlaying, setIsPlaying] = useState(true);
    const [adminQrVisible, setAdminQrVisible] = useState(true);
    const [adminTimer, setAdminTimer] = useState(120); // 2 minutes

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        socket.on('queue_updated', (updatedQueue: Song[]) => {
            setQueue(updatedQueue);
        });

        socket.on('now_playing', (song: Song | null) => {
            addLog(`Evento now_playing recebido: ${song?.title}`);
            setCurrentSong(song);
            setIsPlaying(true);
        });

        socket.on('playback_action', (action: 'play' | 'pause') => {
            setIsPlaying(action === 'play');
        });

        return () => {
            socket.off('queue_updated');
            socket.off('now_playing');
            socket.off('playback_action');
        };
    }, [socket]);

    // Admin QR Timer
    useEffect(() => {
        if (roomId && adminQrVisible) {
            const interval = setInterval(() => {
                setAdminTimer((prev) => {
                    if (prev <= 1) {
                        setAdminQrVisible(false);
                        clearInterval(interval);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [roomId, adminQrVisible]);

    const [logs, setLogs] = useState<string[]>([]);
    const addLog = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);

    // Listen for room_created event as fallback
    useEffect(() => {
        if (!socket) return;

        socket.on('room_created', (response: { roomId: string }) => {
            addLog(`Evento room_created recebido: ${JSON.stringify(response)}`);
            if (response && response.roomId) {
                setRoomId(response.roomId);
                setIsCreating(false);
            }
        });

        return () => {
            socket.off('room_created');
        };
    }, [socket]);

    const [isCreating, setIsCreating] = useState(false);

    // Join room when roomId is set or socket reconnects
    useEffect(() => {
        if (socket && isConnected && roomId) {
            addLog(`Socket conectado (${socket.id}). Tentando entrar na sala: ${roomId}`);
            socket.emit('join_room', roomId, (response: any) => {
                addLog(`Join Room Response: ${JSON.stringify(response)}`);
                if (!response.success) {
                    addLog(`Erro ao entrar na sala: ${response.error}`);
                    if (response.error === 'Room not found') {
                        alert('A sala não existe mais no servidor. Por favor, recrie a sala.');
                        setRoomId(''); // Reset to allow recreation
                    }
                } else {
                    addLog('Entrou na sala com sucesso!');
                }
            });
        } else if (!isConnected && roomId) {
            addLog('Socket desconectado. Aguardando reconexão...');
        }
    }, [socket, isConnected, roomId]);

    const createRoom = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!roomName.trim() || !socket) {
            addLog('Erro: Nome vazio ou socket desconectado');
            return;
        }

        setIsCreating(true);
        addLog(`Tentando criar sala via HTTP: ${roomName}`);

        try {
            const res = await fetch('/api/rooms/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomName, hostId: socket.id }),
            });

            const data = await res.json();
            addLog(`Resposta HTTP: ${JSON.stringify(data)}`);

            if (data.roomId) {
                // Optimistically set roomId to transition UI immediately
                setRoomId(data.roomId);
                setIsCreating(false);
            } else {
                addLog('Erro na criação via API');
                alert('Erro ao criar sala.');
                setIsCreating(false);
            }
        } catch (error) {
            console.error(error);
            addLog(`Erro na requisição: ${error}`);
            alert('Erro ao conectar com o servidor.');
            setIsCreating(false);
        }
    };

    // ... (rest of the component)

    // Update button to use isCreating
    // ...
    // This button is part of the form below, so it's commented out here to avoid duplication.
    // <button
    //     type="submit"
    //     disabled={!isConnected || !roomName || isCreating}
    //     className="w-full py-3 bg-[var(--neon-purple)] hover:bg-[var(--neon-pink)] text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
    // >
    //     {isCreating ? 'CRIANDO...' : (isConnected ? 'CRIAR SALA' : 'CONECTANDO...')}
    // </button>

    const handleSongEnd = () => {
        if (socket && roomId) {
            socket.emit('play_next', { roomId });
        }
    };

    const handleRemoveSong = (uuid: string) => {
        if (socket && roomId) {
            socket.emit('remove_from_queue', { roomId, songUuid: uuid });
        }
    };

    const handleMoveSong = (uuid: string, direction: 'up' | 'down') => {
        if (socket && roomId) {
            socket.emit('move_in_queue', { roomId, songUuid: uuid, direction });
        }
    };

    const handleAddSong = (song: any) => {
        if (!socket) {
            alert('ERRO CRÍTICO: Objeto Socket não existe. Recarregue a página.');
            return;
        }
        if (!socket.connected) {
            alert('ERRO DE CONEXÃO: O socket está desconectado. Tentando reconectar...');
            socket.connect();
            return;
        }
        if (!roomId) {
            alert('ERRO CRÍTICO: Sala não identificada. Recarregue a página.');
            return;
        }

        addLog(`Enviando add_to_queue: ${song.title} (Room: ${roomId})`);

        // Re-enable callback for definitive confirmation
        const timeout = setTimeout(() => {
            alert('ALERTA: O servidor demorou para responder. Verifique se a música apareceu.');
        }, 3000);

        socket.emit('add_to_queue', { roomId, song }, (response: any) => {
            clearTimeout(timeout);
            if (response?.success) {
                alert(`Sucesso! Música "${song.title}" adicionada.`);
                addLog('Callback: Sucesso');
            } else {
                alert(`Erro do Servidor: ${response?.error}`);
                addLog(`Callback Erro: ${response?.error}`);
            }
        });
    };

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    // Update URLs to point to dynamic routes correctly
    const guestUrl = `${siteUrl}/guest/${roomId}`;
    const adminUrl = `${siteUrl}/admin/${roomId}`;

    if (!roomId) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black text-white">
                <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 border border-[var(--neon-purple)] box-glow-purple backdrop-blur-xl">
                    <h1 className="text-4xl font-bold text-center mb-8 text-glow-purple">MELODY MIX</h1>
                    <form onSubmit={createRoom} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-[var(--neon-blue)] mb-2">Nome da Festa</label>
                            <input
                                type="text"
                                value={roomName}
                                onChange={(e) => setRoomName(e.target.value)}
                                className="w-full px-4 py-3 bg-black/50 border border-white/20 rounded-lg focus:border-[var(--neon-pink)] focus:outline-none text-white placeholder-gray-500 transition-colors"
                                placeholder="Ex: Aniversário do Leo"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!isConnected || !roomName || isCreating}
                            className="w-full py-3 bg-[var(--neon-purple)] hover:bg-[var(--neon-pink)] text-white font-bold rounded-lg transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCreating ? 'CRIANDO...' : (isConnected ? 'CRIAR SALA' : 'CONECTANDO...')}
                        </button>
                    </form>
                </div>

                {/* Debug Logs Area */}
                <div className="fixed bottom-4 right-4 w-96 max-h-48 overflow-y-auto bg-black/80 text-green-400 p-4 rounded border border-green-900 font-mono text-xs z-50 pointer-events-none">
                    <h3 className="font-bold border-b border-green-800 mb-2">Debug Logs</h3>
                    {logs.map((log, i) => (
                        <div key={i}>{log}</div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-black overflow-hidden">
            {/* Main Content - Video Player */}
            <div className="flex-1 relative">
                <VideoPlayer
                    currentSong={currentSong}
                    onEnded={handleSongEnd}
                    isPlaying={isPlaying}
                />



                {/* Room Info */}
                <div className="absolute top-8 right-8 text-right z-50">
                    <h2 className="text-3xl font-bold text-white text-glow-blue">{roomName}</h2>
                    <p className="text-[var(--neon-blue)] font-mono text-xs">Room ID: {roomId}</p>
                    <p className="text-gray-500 font-mono text-[10px]">Socket: {socket?.id || '...'}</p>
                    <div className="flex items-center justify-end gap-2 mt-2">
                        <div className={`text-xs font-bold px-2 py-1 rounded inline-block ${isConnected ? 'bg-green-500/20 text-green-400 border border-green-500/50' : 'bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse'}`}>
                            {isConnected ? '● CONECTADO' : '○ DESCONECTADO'}
                        </div>
                        {!isConnected && (
                            <button
                                onClick={() => window.location.reload()}
                                className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded border border-white/20"
                            >
                                ↻ Recarregar
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Sidebar - Controls */}
            <div className="w-96 h-full border-l border-white/10">
                <HostControls
                    queue={queue}
                    onRemove={handleRemoveSong}
                    onMove={handleMoveSong}
                    onAdd={handleAddSong}
                    guestUrl={guestUrl}
                />
            </div>
        </div>
    );
}
