import React, { useState } from 'react';
import { Song } from '@/types';

interface SongSearchProps {
    onAdd: (song: Omit<Song, 'uuid' | 'addedAt'>) => void;
    guestName: string;
}

export const SongSearch: React.FC<SongSearchProps> = ({ onAdd, guestName }) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const searchYoutube = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
        const searchQuery = `${query} karaoke`;

        try {
            const res = await fetch(
                `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
                    searchQuery
                )}&type=video&maxResults=10&key=${apiKey}`
            );
            const data = await res.json();
            if (data.items) {
                setResults(data.items);
            }
        } catch (error) {
            console.error('Error searching YouTube:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelect = (item: any) => {
        const song = {
            id: item.id.videoId,
            title: item.snippet.title,
            thumbnail: item.snippet.thumbnails.medium.url,
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
                        key={item.id.videoId}
                        onClick={() => handleSelect(item)}
                        className="flex items-center gap-3 bg-white/5 p-3 rounded-xl active:bg-white/20 transition-colors cursor-pointer border border-transparent hover:border-[var(--neon-purple)]"
                    >
                        <img
                            src={item.snippet.thumbnails.default.url}
                            alt={item.snippet.title}
                            className="w-20 h-14 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                            <h3
                                className="text-white text-sm font-medium line-clamp-2"
                                dangerouslySetInnerHTML={{ __html: item.snippet.title }}
                            />
                            <p className="text-gray-400 text-xs mt-1">{item.snippet.channelTitle}</p>
                        </div>
                        <button className="text-[var(--neon-blue)] text-xl font-bold">+</button>
                    </div>
                ))}
            </div>
        </div>
    );
};
