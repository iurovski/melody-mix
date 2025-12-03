/* eslint-disable @next/next/no-img-element */
import React, { useState } from 'react';
import { Song } from '@/types';

interface SongSearchProps {
    onAdd: (song: Omit<Song, 'uuid' | 'addedAt'>) => void;
    guestName: string;
}

type SearchResult = {
    id: string;
    title: string;
    thumbnail: string;
    channelTitle: string;
};

export const SongSearch: React.FC<SongSearchProps> = ({ onAdd, guestName }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);

    const searchYoutube = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        const searchQuery = `${query} karaoke`;

        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data.results) {
                setResults(data.results as SearchResult[]);
            }
        } catch (error) {
            console.error('Error searching YouTube:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: SearchResult) => {
        const song = {
            id: item.id,
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
                {results.map((item) => (
                    <div
                        key={item.id}
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
                            <p className="text-gray-400 text-xs mt-1 truncate break-words">{item.channelTitle}</p>
                        </div>
                        <button className="text-[var(--neon-blue)] text-xl font-bold">+</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
