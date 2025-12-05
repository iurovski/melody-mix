/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { Song } from '@/types';

interface SongSearchProps {
    onAdd: (song: Omit<Song, 'uuid' | 'addedAt'>) => void;
    guestName: string;
    forceScrape?: boolean;
    onSourceChange?: (source: 'api' | 'scraping') => void;
}

type SearchResult = {
    videoId: string;
    title: string;
    thumbnail: string;
    author?: string;
    timestamp?: string;
};

export const SongSearch: React.FC<SongSearchProps> = ({ onAdd, guestName, forceScrape = false, onSourceChange }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const searchYoutube = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}${forceScrape ? '&forceScrape=true' : ''}`);
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

    const handleSelect = (item: SearchResult) => {
        const song = {
            id: item.videoId,
            title: item.title,
            thumbnail: item.thumbnail,
            addedBy: guestName,
        };
        onAdd(song);
        setQuery('');
        setResults([]);
        alert('Música adicionada à fila!');
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
        </div>
    );
};
