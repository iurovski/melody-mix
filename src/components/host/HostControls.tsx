'use client';

import React, { useState } from 'react';
import { Song } from '@/types';
import { SongSearch } from '@/components/admin/SongSearch'; // We can reuse logic/component or adapt

import { QRCodeSVG } from 'qrcode.react';

interface HostControlsProps {
    queue: Song[];
    onRemove: (uuid: string) => void;
    onMove: (uuid: string, direction: 'up' | 'down') => void;
    onAdd: (song: Omit<Song, 'uuid' | 'addedAt'>) => void;
    guestUrl: string;
}

export const HostControls: React.FC<HostControlsProps> = ({ queue, onRemove, onMove, onAdd, guestUrl }) => {
    const [activeTab, setActiveTab] = useState<'queue' | 'add'>('queue');

    return (
        <div className="w-full h-full bg-black/80 border-l border-[var(--neon-blue)] flex flex-col backdrop-blur-md">
            {/* Tabs */}
            <div className="flex border-b border-white/10">
                <button
                    onClick={() => setActiveTab('queue')}
                    className={`flex-1 py-4 font-bold text-sm tracking-wider transition-colors ${activeTab === 'queue'
                        ? 'bg-[var(--neon-blue)]/10 text-[var(--neon-blue)] border-b-2 border-[var(--neon-blue)]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    FILA ({queue.length})
                </button>
                <button
                    onClick={() => setActiveTab('add')}
                    className={`flex-1 py-4 font-bold text-sm tracking-wider transition-colors ${activeTab === 'add'
                        ? 'bg-[var(--neon-pink)]/10 text-[var(--neon-pink)] border-b-2 border-[var(--neon-pink)]'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    ADICIONAR
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden p-4">
                {activeTab === 'queue' ? (
                    <div className="h-full overflow-y-auto space-y-3 pr-2 scrollbar-hide">
                        {queue.length === 0 ? (
                            <div className="text-gray-500 text-center mt-10 italic">
                                A fila está vazia...
                            </div>
                        ) : (
                            queue.map((song, index) => (
                                <div
                                    key={song.uuid}
                                    className="group relative flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 hover:border-[var(--neon-blue)] transition-all duration-300"
                                >
                                    <span className="text-gray-500 font-mono w-5 text-center text-sm">{index + 1}</span>
                                    <img
                                        src={song.thumbnail}
                                        alt={song.title}
                                        className="w-10 h-10 object-cover rounded"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-white truncate">{song.title}</p>
                                        <p className="text-xs text-[var(--neon-pink)] truncate">{song.addedBy}</p>
                                    </div>

                                    {/* Controls */}
                                    <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => onMove(song.uuid, 'up')}
                                            disabled={index === 0}
                                            className="text-[var(--neon-blue)] hover:text-white disabled:opacity-30 text-[10px]"
                                        >
                                            ▲
                                        </button>
                                        <button
                                            onClick={() => onMove(song.uuid, 'down')}
                                            disabled={index === queue.length - 1}
                                            className="text-[var(--neon-blue)] hover:text-white disabled:opacity-30 text-[10px]"
                                        >
                                            ▼
                                        </button>
                                    </div>
                                    <button
                                        onClick={() => onRemove(song.uuid)}
                                        className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:text-red-400 transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="h-full overflow-y-auto">
                        <div className="[&>div]:bg-transparent [&>div]:shadow-none [&>div]:p-0">
                            <SongSearch onAddSong={onAdd} />
                        </div>
                    </div>
                )}
            </div>

            {/* QR Code Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40">
                <div className="flex flex-col items-center justify-center gap-2">
                    <div className="bg-white p-2 rounded-lg">
                        <QRCodeSVG value={guestUrl} size={100} level="L" includeMargin={false} />
                    </div>
                    <p className="text-[var(--neon-blue)] text-xs font-bold uppercase tracking-wider">Entrar na Festa</p>
                </div>
            </div>
        </div>
    );
};
