'use client';
/* eslint-disable @next/next/no-img-element */

import React, { useState } from 'react';
import { Song } from '@/types';

interface SongSearchProps {
    onAddSong: (song: Omit<Song, 'uuid' | 'addedAt'>) => void;
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

export const SongSearch: React.FC<SongSearchProps> = ({ onAddSong, forceScrape = false, onSourceChange }) => {
    const [query, setQuery] = useState('');
    const [userName, setUserName] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
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
            console.error('Error searching:', error);
            alert('Erro ao buscar músicas.');
            if (onSourceChange) onSourceChange(forceScrape ? 'scraping' : 'api');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAdd = (video: SearchResult) => {
        if (!userName.trim()) {
            alert('Por favor, digite seu nome antes de adicionar.');
            return;
        }

        const song: Omit<Song, 'uuid' | 'addedAt'> = {
            id: video.videoId,
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
        <div className="bg-gray-800 p-6 rounded-lg shadow-lg w-full">
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
                        placeholder="Pesquise músicas no YouTube"
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

            <div className="grid gap-3 max-h-96 overflow-y-auto w-full">
                {isLoading && (
                    <>
                        {Array.from({ length: 3 }).map((_, idx) => (
                            <div key={idx} className="flex items-center gap-3 p-3 bg-gray-700/30 rounded w-full animate-pulse">
                                <div className="w-16 h-12 rounded bg-gray-600/50" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-gray-600/50 rounded w-4/5" />
                                    <div className="h-2 bg-gray-600/40 rounded w-2/3" />
                                </div>
                                <div className="w-16 h-8 rounded bg-gray-600/40" />
                            </div>
                        ))}
                    </>
                )}

                {!isLoading && results.map((video) => (
                    <div
                        key={video.videoId}
                        className="flex items-center gap-3 p-3 bg-gray-700/50 rounded hover:bg-gray-700 transition-colors w-full"
                    >
                        <img src={video.thumbnail} alt={video.title} className="w-16 h-12 object-cover rounded shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white line-clamp-2 break-words">{video.title}</p>
                            <p className="text-xs text-gray-400 truncate break-words">{video.author || 'YouTube'}</p>
                            {video.timestamp && <p className="text-[10px] text-gray-500 truncate">{video.timestamp}</p>}
                        </div>
                        <button
                            onClick={() => handleAdd(video)}
                            className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded whitespace-nowrap"
                        >
                            Adicionar
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};
