/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { Song } from '@/types';

interface QueueSidebarProps {
    queue: Song[];
    onRemove?: (uuid: string) => void;
}

export const QueueSidebar: React.FC<QueueSidebarProps> = ({ queue, onRemove }) => {
    return (
        <div className="w-full h-full bg-black/80 border-l border-[var(--neon-blue)] p-4 flex flex-col backdrop-blur-md">
            <h2 className="text-2xl font-bold mb-6 text-[var(--neon-blue)] text-glow-blue uppercase tracking-wider">
                Próximas Músicas
            </h2>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 scrollbar-hide">
                {queue.length === 0 ? (
                    <div className="text-gray-500 text-center mt-10 italic">
                        A fila está vazia...<br />Adicione músicas pelo celular!
                    </div>
                ) : (
                    queue.map((song, index) => (
                        <div
                            key={song.uuid}
                            className="group relative flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 hover:border-[var(--neon-pink)] transition-all duration-300"
                        >
                            <div className="text-xl font-bold text-gray-500 w-6 text-center">
                                {index + 1}
                            </div>
                            <img
                                src={song.thumbnail}
                                alt={song.title}
                                className="w-12 h-12 object-cover rounded-md"
                            />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-white truncate text-sm">{song.title}</h3>
                                <p className="text-xs text-[var(--neon-pink)] truncate">
                                    Pedida por: {song.addedBy}
                                </p>
                            </div>

                            {onRemove && (
                                <button
                                    onClick={() => onRemove(song.uuid)}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-red-500 hover:text-red-400 transition-opacity"
                                    title="Remover"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
