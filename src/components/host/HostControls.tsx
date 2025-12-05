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
    guestQrVisible: boolean;
    onToggleGuestQr: () => void;
    useScraping: boolean;
    onToggleScraping: () => void;
    searchMode: 'api' | 'scraping';
    onSearchSourceChange: (source: 'api' | 'scraping') => void;
    roomId?: string;
    restrictionMode: 'blacklist' | 'open';
    onToggleRestrictionMode: () => void;
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

export const HostControls: React.FC<HostControlsProps> = ({
    queue,
    onRemove,
    onMove,
    onAdd,
    onPlayNow,
    guestUrl,
    guestQrVisible,
    onToggleGuestQr,
    useScraping,
    onToggleScraping,
    searchMode,
    onSearchSourceChange,
    roomId,
    restrictionMode,
    onToggleRestrictionMode,
}) => {
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
        <div className="w-full h-auto lg:h-full bg-black/80 border-t lg:border-t-0 lg:border-l border-[var(--neon-blue)] flex flex-col backdrop-blur-md">
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
                            <SongSearch
                                onAddSong={onAdd}
                                forceScrape={useScraping}
                                onSourceChange={onSearchSourceChange}
                                roomId={roomId}
                                restrictionMode={restrictionMode}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* QR Code Footer */}
            <div className="p-4 border-t border-white/10 bg-black/40 space-y-4 max-h-64 overflow-y-auto">
                {guestQrVisible ? (
                    <div className="flex flex-col items-center justify-center gap-2">
                        <div className="bg-white p-2 rounded-lg">
                            <QRCodeSVG value={guestUrl} size={100} level="L" includeMargin={false} />
                        </div>
                        <p className="text-[var(--neon-blue)] text-xs font-bold uppercase tracking-wider">Entrar na Festa</p>
                        {useScraping && (
                            <p className="text-[10px] text-orange-200/90 text-center">Busca em modo scraping ativada</p>
                        )}
                    </div>
                ) : (
                    <div className="text-center text-xs text-gray-400 bg-white/5 border border-white/10 rounded-lg py-4 px-3">
                        Convite oculto. Use o controle manual na tela ou peça para o admin.
                    </div>
                )}

                <div className="pt-2 border-t border-white/10 space-y-2">
                    <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 text-center">Role para ajustar</p>
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between gap-3">
                            <span className={`text-[10px] px-2 py-1 rounded border ${
                                searchMode === 'scraping'
                                    ? 'bg-orange-500/20 border-orange-400/60 text-orange-200'
                                    : 'bg-[var(--neon-blue)]/15 border-[var(--neon-blue)]/30 text-[var(--neon-blue)]'
                            }`}>
                                {searchMode === 'scraping' ? 'Modo: Scraping' : 'Modo: API'}
                            </span>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={onToggleScraping}
                                    className={`text-[10px] px-3 py-1 rounded border transition-all ${
                                        useScraping
                                            ? 'bg-orange-500/20 border-orange-400/60 text-orange-200 hover:bg-orange-500/30'
                                            : 'bg-black/40 border-white/15 text-gray-300 hover:bg-white/10'
                                    }`}
                                    title="Força busca via scraping (yt-search) em vez da API"
                                >
                                    Sem API
                                </button>
                                <button
                                    type="button"
                                    onClick={onToggleGuestQr}
                                    className={`text-xs px-3 py-1 rounded border transition-all ${
                                        guestQrVisible
                                            ? 'bg-white/10 border-white/20 text-white hover:bg-white/20'
                                            : 'bg-black/40 border-red-500/40 text-red-300 hover:bg-red-500/10'
                                    }`}
                                >
                                    {guestQrVisible ? 'Ocultar' : 'Mostrar'}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                            <div>
                                <p className="text-[10px] uppercase text-gray-400 tracking-[0.2em]">Falha no player</p>
                                <p className="text-xs text-white">
                                    {restrictionMode === 'blacklist' ? 'Blacklistar e remover resultados' : 'Abrir no YouTube (sem blacklist)'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onToggleRestrictionMode}
                                className={`text-[11px] px-3 py-1 rounded border transition-all ${
                                    restrictionMode === 'blacklist'
                                        ? 'bg-red-500/20 border-red-500/50 text-red-200 hover:bg-red-500/30'
                                        : 'bg-[var(--neon-blue)]/20 border-[var(--neon-blue)]/50 text-[var(--neon-blue)] hover:bg-[var(--neon-blue)]/30'
                                }`}
                            >
                                {restrictionMode === 'blacklist' ? 'Blacklistar' : 'Abrir no YouTube'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
