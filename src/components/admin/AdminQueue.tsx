'use client';

import React from 'react';
import { Song } from '@/types';

interface AdminQueueProps {
    queue: Song[];
    onRemove: (uuid: string) => void;
    onMove: (uuid: string, direction: 'up' | 'down') => void;
}

export const AdminQueue: React.FC<AdminQueueProps> = ({ queue, onRemove, onMove }) => {
    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg h-full flex flex-col">
            <h2 className="text-xl font-bold mb-4 text-white">Fila ({queue.length})</h2>
            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {queue.length === 0 ? (
                    <p className="text-gray-500 text-center italic mt-4">Fila vazia.</p>
                ) : (
                    queue.map((song, index) => (
                        <div key={song.uuid} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded border border-gray-700 hover:border-gray-600 transition-colors">
                            <span className="text-gray-400 font-mono w-6 text-center">{index + 1}</span>
                            <img src={song.thumbnail} alt={song.title} className="w-12 h-9 object-cover rounded" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                                <p className="text-xs text-gray-400">Pedida por: {song.addedBy}</p>
                            </div>
                            <div className="flex flex-col gap-1">
                                <button
                                    onClick={() => onMove(song.uuid, 'up')}
                                    disabled={index === 0}
                                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                                    title="Mover para cima"
                                >
                                    ▲
                                </button>
                                <button
                                    onClick={() => onMove(song.uuid, 'down')}
                                    disabled={index === queue.length - 1}
                                    className="p-1 text-gray-400 hover:text-white disabled:opacity-30"
                                    title="Mover para baixo"
                                >
                                    ▼
                                </button>
                            </div>
                            <button
                                onClick={() => onRemove(song.uuid)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded ml-2"
                                title="Remover"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
