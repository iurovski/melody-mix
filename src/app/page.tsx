'use client';

import React, { useCallback, useEffect, useState } from 'react';
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
    type RoomStatus = 'idle' | 'joining' | 'joined' | 'missing' | 'disconnected';
    const [roomStatus, setRoomStatus] = useState<RoomStatus>('idle');
    const [adminQrVisible, setAdminQrVisible] = useState(true);
    const [adminTimer, setAdminTimer] = useState(120); // 2 minutes
    const [announcementData, setAnnouncementData] = useState<Song | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const [logs, setLogs] = useState<string[]>([]);
    const addLog = useCallback((msg: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${msg}`]);
    }, []);
    const enqueueLog = useCallback((msg: string) => queueMicrotask(() => addLog(msg)), [addLog]);
    const deferRoomStatus = useCallback((status: RoomStatus) => {
        queueMicrotask(() => setRoomStatus(status));
    }, []);

    type JoinRoomResponse = {
        success: boolean;
        error?: string;
        roomState?: {
            queue: Song[];
            currentSong: Song | null;
        };
    };

    type AddSongResponse = {
        success?: boolean;
        error?: string;
    };

    // Socket Event Listeners
    useEffect(() => {
        if (!socket) return;

        const handleConnect = () => {
            setRoomStatus((prev) => {
                if (roomId) return 'joining';
                return prev === 'disconnected' ? 'idle' : prev;
            });
        };
        const handleDisconnect = () => setRoomStatus('disconnected');

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        socket.on('queue_updated', (updatedQueue: Song[]) => {
            setQueue(updatedQueue);
        });

        socket.on('singer_announcement', (song: Song) => {
            addLog(`Anúncio: ${song.title} (${song.addedBy})`);
            setAnnouncementData(song);
            setIsPlaying(false);
        });

        socket.on('now_playing', (song: Song | null) => {
            addLog(`Evento now_playing recebido: ${song?.title}`);
            setAnnouncementData(null); // Hide announcement
            setCurrentSong(song);
            setIsPlaying(true);
        });

        socket.on('playback_action', (action: 'play' | 'pause') => {
            setIsPlaying(action === 'play');
        });

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
            socket.off('queue_updated');
            socket.off('singer_announcement');
            socket.off('now_playing');
            socket.off('playback_action');
        };
    }, [socket, addLog, roomId]);

    // ... (rest of the code)

    const handleStartPerformance = () => {
        if (socket && roomId) {
            socket.emit('start_performance', { roomId });
        }
    };

    // Listen for room_created event as fallback
    useEffect(() => {
        if (!socket) return;

        socket.on('room_created', (response: { roomId: string }) => {
            enqueueLog(`Evento room_created recebido: ${JSON.stringify(response)}`);
            if (response && response.roomId) {
                setRoomId(response.roomId);
                setIsCreating(false);
            }
        });

        return () => {
            socket.off('room_created');
        };
    }, [socket, enqueueLog]);

    // Join room when roomId is set or socket reconnects
    useEffect(() => {
        if (socket && isConnected && roomId) {
            deferRoomStatus('joining');
            enqueueLog(`Socket conectado (${socket.id}). Tentando entrar na sala: ${roomId}`);
            socket.emit('join_room', roomId, (response: JoinRoomResponse) => {
                enqueueLog(`Join Room Response: ${JSON.stringify(response)}`);
                if (!response.success) {
                    enqueueLog(`Erro ao entrar na sala: ${response.error}`);
                    if (response.error === 'Room not found') {
                        deferRoomStatus('missing');
                        alert('A sala não existe mais no servidor. Por favor, recrie a sala.');
                        setRoomId(''); // Reset to allow recreation
                    } else {
                        deferRoomStatus('missing');
                    }
                } else {
                    enqueueLog('Entrou na sala com sucesso!');
                    deferRoomStatus('joined');
                }
            });
        } else if (!isConnected && roomId) {
            enqueueLog('Socket desconectado. Aguardando reconexão...');
            deferRoomStatus('disconnected');
        }
    }, [socket, isConnected, roomId, enqueueLog, deferRoomStatus]);

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

    const handleSongEnd = () => {
        if (socket && roomId) {
            socket.emit('play_next', { roomId });
        }
    };

    const handlePlayback = (action: 'play' | 'pause') => {
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
            socket.emit('play_now', { roomId, songUuid: uuid });
        }
    };

    const handleAddSong = (song: Omit<Song, 'uuid' | 'addedAt'>) => {
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
            addLog('ERRO CRÍTICO: Sala não identificada. Recarregue a página.');
            return;
        }

        addLog(`Enviando add_to_queue: ${song.title} (Room: ${roomId})`);

        socket.emit('add_to_queue', { roomId, song }, (response: AddSongResponse) => {
            if (response?.success) {
                addLog(`Sucesso! Música "${song.title}" adicionada.`);
                addLog('Callback: Sucesso');
            } else {
                addLog(`Erro do Servidor: ${response?.error}`);
                addLog(`Callback Erro: ${response?.error}`);
            }
        });
    };

    const siteUrl = typeof window !== 'undefined'
        ? window.location.origin
        : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');
    const guestUrl = `${siteUrl}/guest/${roomId}`;
    const adminUrl = `${siteUrl}/admin/${roomId}`;

    // Admin QR code auto-expiration
    useEffect(() => {
        if (!roomId) return;

        setTimeout(() => {
            setAdminQrVisible(true);
            setAdminTimer(120);
        }, 0);

        const interval = setInterval(() => {
            setAdminTimer((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setAdminQrVisible(false);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [roomId]);

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

    // ... (inside return)

    return (
        <div className="flex min-h-screen lg:h-screen flex-col lg:flex-row bg-black overflow-x-hidden lg:overflow-hidden">
            {/* Main Content - Video Player OR Announcement */}
            <div className="flex-1 relative min-h-[60vh] lg:min-h-0">
                {adminQrVisible && (
                    <div className="absolute bottom-8 left-8 z-50 bg-black/80 border border-[var(--neon-purple)] rounded-2xl p-4 shadow-2xl shadow-purple-900/40 backdrop-blur-md w-72">
                        <div className="flex items-start justify-between mb-3 gap-2">
                            <div>
                                <p className="text-xs text-[var(--neon-blue)] font-bold uppercase tracking-wider">Painel Admin</p>
                                <p className="text-white text-sm">Escaneie para assumir a fila</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-1 text-[10px] font-bold rounded bg-white/10 border border-white/10 text-gray-300">
                                    {Math.max(adminTimer, 0)}s
                                </span>
                                <button
                                    type="button"
                                    onClick={() => setAdminQrVisible(false)}
                                    className="text-gray-400 hover:text-white text-sm px-2"
                                    title="Fechar QR"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="bg-white p-2 rounded-xl">
                                <QRCodeSVG value={adminUrl} size={140} level="L" includeMargin={false} />
                            </div>
                            <p className="text-[var(--neon-purple)] text-xs uppercase tracking-wider text-center">
                                Válido por 2 minutos após a criação
                            </p>
                        </div>
                    </div>
                )}

                {announcementData ? (
                    <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl p-10 text-center animate-fade-in">
                        <h2 className="text-[var(--neon-blue)] text-2xl font-bold uppercase tracking-widest mb-4">Próximo Cantor</h2>
                        <h1 className="text-white text-6xl md:text-8xl font-black mb-8 text-glow-purple drop-shadow-2xl">
                            {announcementData.addedBy}
                        </h1>
                        <div className="bg-white/10 p-6 rounded-2xl border border-white/20 mb-12 max-w-3xl">
                            <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Vai cantar</p>
                            <p className="text-white text-3xl md:text-4xl font-bold leading-tight">
                                {announcementData.title}
                            </p>
                        </div>
                        <button
                            onClick={handleStartPerformance}
                            className="px-12 py-6 bg-gradient-to-r from-[var(--neon-purple)] to-[var(--neon-pink)] text-white text-2xl font-bold rounded-full shadow-lg shadow-purple-500/50 hover:scale-105 transition-transform duration-300 animate-pulse"
                        >
                            INICIAR APRESENTAÇÃO ▶
                        </button>
                    </div>
                ) : currentSong ? (
                    <VideoPlayer
                        currentSong={currentSong}
                        onEnded={handleSongEnd}
                        isPlaying={isPlaying}
                        onPlayPause={handlePlayback}
                        onSkip={handleSkip}
                    />
                ) : (
                    /* Idle Screen */
                    <div className="absolute inset-0 z-0 flex flex-col items-center justify-center bg-black text-[var(--neon-purple)]">
                        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1516280440614-6697288d5d38?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-20"></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>

                        <div className="relative z-10 text-center animate-pulse-slow">
                            <h1 className="text-7xl md:text-9xl font-black mb-6 text-glow-purple tracking-tighter">
                                MELODY MIX
                            </h1>
                            <p className="text-2xl md:text-4xl text-white font-light tracking-widest uppercase mb-12">
                                Venha soltar a voz com a gente!
                            </p>

                            <div className="bg-white/10 p-8 rounded-3xl border border-white/20 backdrop-blur-md inline-flex flex-col items-center gap-4 shadow-2xl shadow-purple-900/20">
                                <div className="bg-white p-4 rounded-xl">
                                    <QRCodeSVG value={guestUrl} size={200} level="L" includeMargin={false} />
                                </div>
                                <p className="text-[var(--neon-blue)] text-sm font-bold uppercase tracking-wider">Escaneie para pedir música</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Room Info (Keep visible) */}
                <div className="absolute top-8 right-8 text-right z-50 pointer-events-none">
                    <h2 className="text-3xl font-bold text-white text-glow-blue">{roomName}</h2>
                    <p className="text-[var(--neon-blue)] font-mono text-xs">Room ID: {roomId}</p>
                    <p className="text-gray-500 font-mono text-[10px]">Socket: {socket?.id || '...'}</p>
                    <div className="flex items-center justify-end gap-2 mt-2 pointer-events-auto">
                        <div
                            className={`text-xs font-bold px-2 py-1 rounded inline-block border ${
                                roomStatus === 'joined'
                                    ? 'bg-green-500/20 text-green-400 border-green-500/50'
                                    : roomStatus === 'joining'
                                        ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50 animate-pulse'
                                        : 'bg-red-500/20 text-red-400 border-red-500/50'
                            }`}
                        >
                            {roomStatus === 'joined' && '● SALA ATIVA'}
                            {roomStatus === 'joining' && '… ENTRANDO NA SALA'}
                            {roomStatus === 'missing' && '× SALA INDISPONÍVEL'}
                            {roomStatus === 'disconnected' && '○ DESCONECTADO'}
                            {roomStatus === 'idle' && '○ AGUARDANDO'}
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
            <div className="w-full lg:w-96 lg:flex-shrink-0">
                <HostControls
                    queue={queue}
                    onRemove={handleRemoveSong}
                    onMove={handleMoveSong}
                    onAdd={handleAddSong}
                    onPlayNow={handlePlayNow}
                    guestUrl={guestUrl}
                />
            </div>
        </div>
    );
}
