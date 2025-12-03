'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { Song } from '@/types';
import { SongSearch } from '@/components/admin/SongSearch';
import { QRCodeSVG } from 'qrcode.react';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface HostControlsProps {
    queue: Song[];
    onRemove: (uuid: string) => void;
    onMove: (oldIndex: number, newIndex: number) => void;
    onAdd: (song: Omit<Song, 'uuid' | 'addedAt'>) => void;
    onPlayNow: (uuid: string) => void;
    guestUrl: string;
}

function SortableItem({ song, index, onRemove, onPlayNow }: { song: Song; index: number; onRemove: (id: string) => void; onPlayNow: (id: string) => void }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: song.uuid });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="group relative flex items-center gap-3 bg-white/5 p-3 rounded-lg border border-white/10 hover:border-[var(--neon-blue)] transition-all duration-300 touch-none"
        >
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-white">
                ⋮⋮
            </div>

            <span className="text-gray-500 font-mono w-5 text-center text-sm">{index + 1}</span>
            <img
                src={song.thumbnail}
                alt={song.title}
                className="w-10 h-10 object-cover rounded pointer-events-none"
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{song.title}</p>
                <p className="text-xs text-[var(--neon-pink)] truncate">{song.addedBy}</p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onPlayNow(song.uuid)}
                    className="p-1.5 bg-[var(--neon-purple)] hover:bg-[var(--neon-pink)] text-white rounded-full transition-colors"
                    title="Tocar Agora"
                >
                    ▶
                </button>
                <button
                    onClick={() => onRemove(song.uuid)}
                    className="p-1.5 text-red-500 hover:text-red-400 transition-colors"
                    title="Remover"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}

export const HostControls: React.FC<HostControlsProps> = ({ queue, onRemove, onMove, onAdd, onPlayNow, guestUrl }) => {
    const [activeTab, setActiveTab] = useState<'queue' | 'add'>('queue');

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            const oldIndex = queue.findIndex((item) => item.uuid === active.id);
            const newIndex = queue.findIndex((item) => item.uuid === over?.id);
            onMove(oldIndex, newIndex);
        }
    };

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
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={queue.map(s => s.uuid)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {queue.map((song, index) => (
                                        <SortableItem
                                            key={song.uuid}
                                            song={song}
                                            index={index}
                                            onRemove={onRemove}
                                            onPlayNow={onPlayNow}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
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
