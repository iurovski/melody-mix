'use client';

import React, { useState } from 'react';
import YouTube, { YouTubeProps } from 'react-youtube';

type VideoPreviewModalProps = {
    videoId: string;
    title: string;
    onConfirm: () => void;
    onClose: () => void;
    onRestricted: (videoId: string) => void;
};

type PreviewState = 'loading' | 'ready' | 'restricted';

export const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({
    videoId,
    title,
    onConfirm,
    onClose,
    onRestricted,
}) => {
    const [state, setState] = useState<PreviewState>('loading');

    const opts: YouTubeProps['opts'] = {
        height: '240',
        width: '100%',
        playerVars: {
            autoplay: 0,
            controls: 1,
            modestbranding: 1,
        },
    };

    const handleReady: YouTubeProps['onReady'] = () => {
        setState('ready');
    };

    const handleError: YouTubeProps['onError'] = () => {
        setState((prev) => {
            if (prev === 'restricted') return prev;
            queueMicrotask(() => onRestricted(videoId));
            return 'restricted';
        });
    };

    const disabled = state !== 'ready';

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-lg bg-gray-900 text-white rounded-t-3xl shadow-2xl border border-white/10 p-4 md:p-6 transition-transform duration-300 translate-y-0">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div>
                        <p className="text-[10px] uppercase text-gray-400 tracking-[0.2em] mb-1">Pré-visualização</p>
                        <h3 className="text-lg font-bold leading-snug line-clamp-2 break-words">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-white text-lg px-2"
                        aria-label="Fechar pré-visualização"
                    >
                        ✕
                    </button>
                </div>

                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-black/60">
                    {state === 'restricted' ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-center">
                            <div className="text-4xl">🚫</div>
                            <p className="text-sm font-semibold text-red-300">Vídeo restrito para incorporação</p>
                            <p className="text-xs text-gray-400">Escolha outra opção da lista.</p>
                        </div>
                    ) : (
                        <YouTube
                            videoId={videoId}
                            opts={opts}
                            className="w-full h-full"
                            iframeClassName="w-full h-full"
                            onReady={handleReady}
                            onError={handleError}
                        />
                    )}
                </div>

                <div className="mt-5 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={disabled || state === 'restricted'}
                        className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all ${
                            disabled || state === 'restricted'
                                ? 'bg-white/10 text-gray-500 cursor-not-allowed'
                                : 'bg-[var(--neon-blue)] text-black hover:bg-white'
                        }`}
                    >
                        {state === 'restricted' ? 'Indisponível para Karaokê' : 'Confirmar Música'}
                    </button>
                    <button
                        onClick={onClose}
                        className="px-4 py-3 rounded-xl border border-white/20 text-sm text-white hover:bg-white/10 transition-colors"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};
