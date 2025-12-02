import React, { useEffect, useRef, useState } from 'react';
import { Song } from '@/types';

interface VideoPlayerProps {
    currentSong: Song | null;
    onEnded: () => void;
    isPlaying: boolean;
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT: any;
    }
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ currentSong, onEnded, isPlaying }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<any>(null);
    const [isApiReady, setIsApiReady] = useState(false);

    // Load YouTube IFrame API
    useEffect(() => {
        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                setIsApiReady(true);
            };
        } else {
            setIsApiReady(true);
        }
    }, []);

    // Initialize Player when API is ready and iframe exists
    useEffect(() => {
        if (isApiReady && iframeRef.current && !playerRef.current && currentSong) {
            playerRef.current = new window.YT.Player(iframeRef.current, {
                events: {
                    'onStateChange': (event: any) => {
                        // 0 = Ended
                        if (event.data === 0) {
                            onEnded();
                        }
                    }
                }
            });
        }
    }, [isApiReady, currentSong, onEnded]);

    // Handle Play/Pause props
    useEffect(() => {
        if (playerRef.current && playerRef.current.getPlayerState) {
            if (isPlaying) {
                playerRef.current.playVideo();
            } else {
                playerRef.current.pauseVideo();
            }
        }
    }, [isPlaying]);

    if (!currentSong) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-black text-[var(--neon-purple)]">
                <div className="text-center animate-pulse">
                    <h1 className="text-6xl font-bold mb-4 text-glow-purple">MELODY MIX</h1>
                    <p className="text-xl text-white/80">Aguardando músicas...</p>
                    <div className="mt-8 p-4 border border-[var(--neon-blue)] rounded-lg inline-block">
                        <p className="text-sm text-[var(--neon-blue)]">Escaneie o QR Code para começar</p>
                    </div>
                </div>
            </div>
        );
    }

    // 1. URL Handling & 2. Origin Parameter
    const getEmbedUrl = (videoId: string) => {
        // Ensure we have just the ID (in case a full URL was passed, though our logic usually passes IDs)
        // Simple regex to extract ID if it's a URL, otherwise assume it's an ID
        const idMatch = videoId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/);
        const cleanId = (idMatch && idMatch[1].length === 11) ? idMatch[1] : videoId;

        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return `https://www.youtube.com/embed/${cleanId}?autoplay=1&enablejsapi=1&origin=${origin}`;
    };

    return (
        <div className="w-full h-full bg-black relative">
            {/* 3. Referrer Policy & 4. Attributes */}
            <iframe
                ref={iframeRef}
                id="youtube-player"
                width="100%"
                height="100%"
                src={getEmbedUrl(currentSong.id)}
                title={currentSong.title}
                frameBorder="0"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
            />

            {/* Overlay for Song Info */}
            <div className="absolute top-10 left-10 bg-black/60 p-4 rounded-xl border-l-4 border-[var(--neon-pink)] backdrop-blur-sm animate-fade-in-out pointer-events-none">
                <h2 className="text-2xl font-bold text-white mb-1">{currentSong.title}</h2>
                <p className="text-[var(--neon-pink)]">Pedida por: {currentSong.addedBy}</p>
            </div>
        </div>
    );
};
