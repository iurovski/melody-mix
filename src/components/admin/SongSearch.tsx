'use client';

import React, { useState } from 'react';
import { Song } from '@/types';

interface SongSearchProps {
    onAddSong: (song: Omit<Song, 'uuid' | 'addedAt'>) => void;
}

export const SongSearch: React.FC<SongSearchProps> = ({ onAddSong }) => {
    const [query, setQuery] = useState('');
    const [userName, setUserName] = useState('');
    const [results, setResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            // Automatically append "karaoke" to the search query to ensure karaoke versions
            const searchQuery = `${query} karaoke`;
            const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`);
            const data = await res.json();
            if (data.results) {
                setResults(data.results);
            }
        } catch (error) {
            console.error('Error searching:', error);
            alert('Erro ao buscar músicas.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = (video: any) => {
        if (!userName.trim()) {
            alert('Por favor, digite seu nome antes de adicionar.');
            return;
        }

        const song: Omit<Song, 'uuid' | 'addedAt'> = {
            id: video.id,
            title: video.title,
            thumbnail: video.thumbnail,
            addedBy: userName,
        };
        console.log('Adding song:', song);
        onAddSong(song);
        setQuery('');
        setResults([]);
    };

    return (
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold mb-4 text-white">Adicionar Música</h2>

            <div className="mb-4">
                <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Seu Nome (quem está pedindo)"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500 mb-2"
                />
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Cole um link do YouTube ou pesquise..."
                        className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded disabled:opacity-50"
                    >
                        {isLoading ? '...' : 'Buscar'}
                    </button>
                </form>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
                {results.map((video) => (
                    <div key={video.id} className="flex items-center gap-3 p-2 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors">
                        <img src={video.thumbnail} alt={video.title} className="w-12 h-9 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{video.title}</p>
                            <p className="text-xs text-gray-400">{video.channelTitle}</p>
                        </div>
                        <button
                            onClick={() => handleAdd(video)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded"
                        >
                            Adicionar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
