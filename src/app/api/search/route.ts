import { NextResponse } from 'next/server';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    // 1. Check if it's a direct YouTube URL
    const videoIdMatch = query.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    if (videoIdMatch) {
        const videoId = videoIdMatch[1];
        // If we have an API key, we can fetch details, otherwise return a basic object
        // For now, let's return a basic object to avoid dependency on API key for direct links
        return NextResponse.json({
            results: [{
                id: videoId,
                title: `YouTube Video (${videoId})`,
                thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
                channelTitle: 'YouTube',
            }]
        });
    }

    // 2. If API Key is present, search YouTube
    if (YOUTUBE_API_KEY) {
        try {
            const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=10&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
            const data = await res.json();

            if (data.items) {
                type YouTubeSearchItem = {
                    id: { videoId: string };
                    snippet: {
                        title: string;
                        thumbnails: { medium: { url: string } };
                        channelTitle: string;
                    };
                };

                const results = (data.items as YouTubeSearchItem[]).map((item) => ({
                    id: item.id.videoId,
                    title: item.snippet.title,
                    thumbnail: item.snippet.thumbnails.medium.url,
                    channelTitle: item.snippet.channelTitle,
                }));
                return NextResponse.json({ results });
            }
        } catch (error) {
            console.error('YouTube API Error:', error);
        }
    }

    // 3. Fallback: Mock results for testing if no key and not a URL
    return NextResponse.json({
        results: [
            {
                id: 'dQw4w9WgXcQ',
                title: 'Rick Astley - Never Gonna Give You Up (Mock Result)',
                thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
                channelTitle: 'Rick Astley',
            },
            {
                id: 'fJ9rUzIMcZQ',
                title: 'Queen - Bohemian Rhapsody (Mock Result)',
                thumbnail: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/mqdefault.jpg',
                channelTitle: 'Queen Official',
            }
        ]
    });
}
