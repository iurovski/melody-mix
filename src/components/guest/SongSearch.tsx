/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { Song } from '@/types';
import { useSocket } from '@/hooks/useSocket';
import { VideoPreviewModal } from '@/components/VideoPreviewModal';

interface SongSearchProps {
    onAdd: (song: Omit<Song, 'uuid' | 'addedAt'>) => void;
    guestName: string;
    forceScrape?: boolean;
    onSourceChange?: (source: 'api' | 'scraping') => void;
    roomId?: string;
}

type SearchResult = {
    videoId: string;
    title: string;
    thumbnail: string;
    author?: string;
    timestamp?: string;
};

export const SongSearch: React.FC<SongSearchProps> = ({ onAdd, guestName, forceScrape = false, onSourceChange, roomId }) => {
    const { socket } = useSocket();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [previewVideo, setPreviewVideo] = useState<SearchResult | null>(null);

    const fetchResults = async (term: string) => {
        setLoading(true);
        try {
            const roomParam = roomId ? `&roomId=${encodeURIComponent(roomId)}` : '';
            const res = await fetch(`/api/search?q=${encodeURIComponent(term.trim())}${forceScrape ? '&forceScrape=true' : ''}${roomParam}`);
            const data = await res.json();
            if (data.results) {
                setResults(data.results as SearchResult[]);
                if (onSourceChange) {
                    const source = data.source === 'scraping' ? 'scraping' : 'api';
                    onSourceChange(source);
                }
            }
        } catch (error) {
            console.error('Error searching YouTube:', error);
            if (onSourceChange) onSourceChange(forceScrape ? 'scraping' : 'api');
        } finally {
            setLoading(false);
        }
    };

    const searchYoutube = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;
        fetchResults(query);
    };

    const handleSelect = (item: SearchResult) => {
        setPreviewVideo(item);
    };

    const handleConfirm = () => {
        if (!previewVideo) return;
        const song = {
            id: previewVideo.videoId,
            title: previewVideo.title,
            thumbnail: previewVideo.thumbnail,
            addedBy: guestName,
        };
        onAdd(song);
        setPreviewVideo(null);
        setQuery('');
        setResults([]);
        alert('Música adicionada à fila!');
    };

    const handleRestriction = (videoId: string) => {
        if (socket) {
            socket.emit('blacklist_video', { videoId, roomId, author: previewVideo?.author });
        }
        setResults((prev) => {
            const next = prev.filter((item) => {
                if (previewVideo?.author) return item.author !== previewVideo.author;
                return item.videoId !== videoId;
            });
            if (next.length === 0 && query.trim()) {
                fetchResults(query);
            }
            return next;
        });
        setPreviewVideo(null);
        alert('Vídeo indisponível para o Karaokê.');
    };

    return (
        <div className="w-full max-w-md mx-auto">
            <form onSubmit={searchYoutube} className="mb-6 relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Pesquisar música..."
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-full focus:border-[var(--neon-blue)] focus:outline-none text-white placeholder-gray-400 pl-12"
                />
                <span className="absolute left-4 top-3.5 text-gray-400">🔍</span>
                <button
                    type="submit"
                    disabled={loading}
                    className="absolute right-2 top-2 bg-[var(--neon-blue)] text-black font-bold px-4 py-1.5 rounded-full text-sm hover:bg-white transition-colors"
                >
                    {loading ? '...' : 'Buscar'}
                </button>
            </form>

            <div className="space-y-3">
                {loading && (
                    <>
                        {Array.from({ length: 4 }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/5 animate-pulse">
                                <div className="w-20 h-14 rounded-lg bg-white/10" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-white/10 rounded w-4/5" />
                                    <div className="h-2 bg-white/5 rounded w-3/5" />
                                </div>
                                <div className="w-6 h-6 rounded-full bg-white/10" />
                            </div>
                        ))}
                    </>
                )}

                {!loading && results.map((item) => (
                    <div
                        key={item.videoId}
                        onClick={() => handleSelect(item)}
                        className="flex items-center gap-3 bg-white/5 p-3 rounded-xl active:bg-white/20 transition-colors cursor-pointer border border-transparent hover:border-[var(--neon-purple)]"
                    >
                        <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-20 h-14 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <h3 className="text-white text-sm font-medium line-clamp-2 break-words">{item.title}</h3>
                            <p className="text-gray-400 text-xs mt-1 truncate break-words">{item.author || 'YouTube'}</p>
                            {item.timestamp && <p className="text-[10px] text-gray-500 mt-0.5 truncate">{item.timestamp}</p>}
                        </div>
                        <button className="text-[var(--neon-blue)] text-xl font-bold">+</button>
                    </div>
                ))}
            </div>

            {previewVideo && (
                <VideoPreviewModal
                    videoId={previewVideo.videoId}
                    title={previewVideo.title}
                    onConfirm={handleConfirm}
                    onClose={() => setPreviewVideo(null)}
                    onRestricted={handleRestriction}
                />
            )}
        </div>
    );
};
