'use client';
/* eslint-disable @next/next/no-img-element */

import React from 'react';
import { Song } from '@/types';

interface AdminQueueProps {
    queue: Song[];
    onRemove: (uuid: string) => void;
    onMove: (oldIndex: number, newIndex: number) => void;
    onPlayNow?: (uuid: string) => void;
}

export const AdminQueue: React.FC<AdminQueueProps> = ({ queue, onRemove, onMove, onPlayNow }) => {
    return (
        <div className="bg-white/5 p-6 rounded-2xl border border-white/10 shadow-2xl shadow-purple-900/20 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-white">Fila ({queue.length})</h2>
                <span className="text-[10px] uppercase tracking-widest text-gray-400">Admin</span>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                {queue.length === 0 ? (
                    <p className="text-gray-500 text-center italic mt-4">Fila vazia.</p>
                ) : (
                    queue.map((song, index) => (
                        <div key={song.uuid} className="flex flex-wrap sm:flex-nowrap items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 hover:border-[var(--neon-blue)] transition-colors">
                            <span className="text-gray-500 font-mono w-6 text-center text-xs shrink-0">{index + 1}</span>
                            <img src={song.thumbnail} alt={song.title} className="w-12 h-9 object-cover rounded shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white line-clamp-2 break-words">{song.title}</p>
                                <p className="text-[11px] text-[var(--neon-pink)] truncate">Pedida por: {song.addedBy}</p>
                            </div>
                            <div className="flex items-center gap-1 sm:flex-row flex-wrap justify-end w-full sm:w-auto">
                                <div className="flex flex-col">
                                    <button
                                        onClick={() => onMove(index, Math.max(index - 1, 0))}
                                        disabled={index === 0}
                                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                                        title="Mover para cima"
                                    >
                                        ▲
                                    </button>
                                    <button
                                        onClick={() => onMove(index, Math.min(index + 1, queue.length - 1))}
                                        disabled={index === queue.length - 1}
                                        className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                                        title="Mover para baixo"
                                    >
                                        ▼
                                    </button>
                                </div>
                                {onPlayNow && (
                                    <button
                                        onClick={() => onPlayNow(song.uuid)}
                                        className="p-2 text-[var(--neon-purple)] hover:text-[var(--neon-pink)] rounded"
                                        title="Tocar agora e iniciar"
                                    >
                                        ▶
                                    </button>
                                )}
                                <button
                                    onClick={() => onRemove(song.uuid)}
                                    className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded"
                                    title="Remover"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
