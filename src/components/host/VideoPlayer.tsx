import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Song } from '@/types';

interface VideoPlayerProps {
    currentSong: Song | null;
    onEnded: () => void;
    isPlaying: boolean;
    onPlayPause: (action: 'play' | 'pause') => void;
    onSkip: () => void;
}

declare global {
    interface Window {
        onYouTubeIframeAPIReady: () => void;
        YT?: YTNamespace;
    }
}

type YouTubePlayer = {
    playVideo: () => void;
    pauseVideo: () => void;
    getPlayerState?: () => number;
};

type YouTubePlayerEvents = {
    onStateChange?: (event: { data: number }) => void;
    onError?: (event?: unknown) => void;
};

type YTNamespace = {
    Player: new (
        element: HTMLIFrameElement,
        config: { events: YouTubePlayerEvents }
    ) => YouTubePlayer;
};

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ currentSong, onEnded, isPlaying, onPlayPause, onSkip }) => {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const playerRef = useRef<YouTubePlayer | null>(null);
    const [isApiReady, setIsApiReady] = useState<boolean>(() => typeof window !== 'undefined' && !!window.YT);
    const fallbackWindowRef = useRef<Window | null>(null);
    const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const [fallbackActive, setFallbackActive] = useState(false);

    // Load YouTube IFrame API
    useEffect(() => {
        if (isApiReady) return;
        if (typeof window === 'undefined') return;

        if (!window.YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

            window.onYouTubeIframeAPIReady = () => {
                setIsApiReady(true);
            };
        } else {
            setTimeout(() => setIsApiReady(true), 0);
        }
    }, [isApiReady]);

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

    const getEmbedUrl = (videoId: string) => {
        const idMatch = videoId.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^#&?]*)/);
        const cleanId = (idMatch && idMatch[1].length === 11) ? idMatch[1] : videoId;
        const origin = typeof window !== 'undefined' ? window.location.origin : '';
        return { cleanId, url: `https://www.youtube.com/embed/${cleanId}?autoplay=1&enablejsapi=1&origin=${origin}` };
    };

    const handleFallbackToNewTab = useCallback(() => {
        if (typeof window === 'undefined' || !currentSong) return;
        const { cleanId } = getEmbedUrl(currentSong.id);
        const watchUrl = `https://www.youtube.com/watch?v=${cleanId}&autoplay=1`;

        if (fallbackWindowRef.current && !fallbackWindowRef.current.closed) {
            fallbackWindowRef.current.close();
        }

        const win = window.open(watchUrl, '_blank', 'noopener,noreferrer');
        if (!win) {
            alert('Não foi possível abrir o YouTube automaticamente. Verifique bloqueador de pop-up.');
            return;
        }

        fallbackWindowRef.current = win;
        setFallbackActive(true);

        if (fallbackIntervalRef.current) {
            clearInterval(fallbackIntervalRef.current);
        }

        fallbackIntervalRef.current = setInterval(() => {
            if (fallbackWindowRef.current?.closed) {
                if (fallbackIntervalRef.current) {
                    clearInterval(fallbackIntervalRef.current);
                    fallbackIntervalRef.current = null;
                }
                setFallbackActive(false);
                onEnded();
            }
        }, 2000);
    }, [currentSong, onEnded]);

    useEffect(() => {
        return () => {
            if (fallbackIntervalRef.current) {
                clearInterval(fallbackIntervalRef.current);
            }
            if (fallbackWindowRef.current && !fallbackWindowRef.current.closed) {
                fallbackWindowRef.current.close();
            }
        };
    }, []);

    // Initialize Player when API is ready and iframe exists
    useEffect(() => {
        if (isApiReady && iframeRef.current && !playerRef.current && currentSong) {
            if (!window.YT) return;
            playerRef.current = new window.YT.Player(iframeRef.current, {
                events: {
                    'onStateChange': (event: { data: number }) => {
                        if (event.data === 0) {
                            onEnded();
                        }
                    },
                    'onError': () => {
                        handleFallbackToNewTab();
                    }
                }
            });
        }
    }, [isApiReady, currentSong, onEnded, handleFallbackToNewTab]);

    if (!currentSong) {
        return null;
    }

    const { url: embedUrl } = getEmbedUrl(currentSong.id);

    return (
        <div className="w-full h-full min-h-[320px] bg-black relative">
            {/* 3. Referrer Policy & 4. Attributes */}
            <iframe
                ref={iframeRef}
                id="youtube-player"
                width="100%"
                height="100%"
                src={embedUrl}
                title={currentSong.title}
                frameBorder="0"
                referrerPolicy="strict-origin-when-cross-origin"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                className="absolute top-0 left-0 w-full h-full"
            />

            {/* Overlay for Song Info */}
            <div className="absolute top-4 left-4 sm:top-6 sm:left-6 lg:top-10 lg:left-10 bg-black/60 px-3 py-2 sm:p-4 rounded-xl border-l-4 border-[var(--neon-pink)] backdrop-blur-sm animate-fade-in-out pointer-events-none max-w-[90%] sm:max-w-lg">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-tight mb-1 sm:mb-1.5 line-clamp-2">
                    {currentSong.title}
                </h2>
                <p className="text-xs sm:text-sm text-[var(--neon-pink)] truncate">Pedida por: {currentSong.addedBy}</p>
            </div>

            {fallbackActive && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/80 border border-[var(--neon-blue)] text-white px-4 py-3 rounded-xl text-sm text-center max-w-lg">
                    Abrimos o vídeo no YouTube em uma nova aba. Ao terminar, feche a aba para tocar o próximo.
                </div>
            )}

            {/* Mobile playback controls */}
            <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-black/70 border border-white/10 rounded-full px-3 py-2 shadow-lg backdrop-blur lg:hidden">
                <button
                    onClick={() => onPlayPause(isPlaying ? 'pause' : 'play')}
                    className="px-3 py-1 rounded-full font-bold text-sm bg-[var(--neon-purple)]/70 hover:bg-[var(--neon-purple)] text-white transition-colors"
                >
                    {isPlaying ? '❚❚ Pausar' : '▶ Reproduzir'}
                </button>
                <button
                    onClick={onSkip}
                    className="px-3 py-1 rounded-full font-bold text-sm bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/10"
                >
                    ⏭ Pular
                </button>
            </div>
        </div>
    );
};
