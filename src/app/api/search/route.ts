import { NextResponse } from 'next/server';
import ytSearch, { type SearchResult as YtSearchResponse, type VideoSearchResult } from 'yt-search';
import { blacklistedVideos, blacklistedAuthors } from '@/lib/store';

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY || process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
const SEARCH_TIMEOUT_MS = 12000;

type SearchResult = {
    title: string;
    videoId: string;
    thumbnail: string;
    timestamp?: string;
    author?: string;
};

type YouTubeSearchItem = {
    id: { videoId: string };
    snippet: {
        title: string;
        thumbnails: { medium: { url: string } };
        channelTitle: string;
    };
};

const extractVideoId = (query: string) => {
    const match = query.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return match?.[1];
};

const normalizeQuery = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    return trimmed.toLowerCase().includes('karaoke') ? trimmed : `${trimmed} karaoke`;
};

const withTimeout = async <T>(promise: Promise<T>, ms: number) => {
    let timer: NodeJS.Timeout;
    const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error('search-timeout')), ms);
    });

    try {
        return await Promise.race([promise, timeout]);
    } finally {
        clearTimeout(timer!);
    }
};

const searchWithScraper = async (query: string, roomId?: string): Promise<SearchResult[]> => {
    const response = await withTimeout(ytSearch({ query, pageEnd: 2 }), SEARCH_TIMEOUT_MS) as YtSearchResponse;
    const videos = Array.isArray(response.videos) ? response.videos : [];

    const blacklist = roomId ? blacklistedAuthors[roomId] : undefined;

    return videos
        .slice(0, 20)
        .map((video: VideoSearchResult) => ({
            title: video.title,
            videoId: video.videoId,
            thumbnail: video.thumbnail || video.image || `https://img.youtube.com/vi/${video.videoId}/mqdefault.jpg`,
            timestamp: video.timestamp,
            author: video.author?.name ?? 'YouTube',
        }))
        .filter((item) => !blacklistedVideos.has(item.videoId))
        .filter((item) => !(blacklist && item.author && blacklist.has(item.author)))
        .slice(0, 10);
};

const searchWithApi = async (query: string, roomId?: string): Promise<SearchResult[] | null> => {
    if (!YOUTUBE_API_KEY) return null;

    try {
        const res = await fetch(`https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}`);
        if (!res.ok) {
            // If quota exceeded (403) or other errors, fall back to scraper
            if (res.status === 403) return null;
            throw new Error(`YouTube API error: ${res.status}`);
        }

        const data = await res.json();
        if (!data.items) return null;

        const items = data.items as YouTubeSearchItem[];
        console.info('[search] using YouTube Data API');
        const blacklist = roomId ? blacklistedAuthors[roomId] : undefined;
        return items
            .map((item) => ({
                title: item.snippet.title,
                videoId: item.id.videoId,
                thumbnail: item.snippet.thumbnails.medium.url,
                author: item.snippet.channelTitle,
            }))
            .filter((item) => !blacklistedVideos.has(item.videoId))
            .filter((item) => !(blacklist && item.author && blacklist.has(item.author)))
            .slice(0, 10);
    } catch (error) {
        console.error('YouTube API Error:', error);
        return null;
    }
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const forceScrape = searchParams.get('forceScrape') === 'true' || searchParams.get('forceScrape') === '1';
    const roomId = searchParams.get('roomId') || undefined;

    if (!query) {
        return NextResponse.json({ results: [] });
    }

    const directId = extractVideoId(query);
    if (directId) {
        console.info('[search] direct link detected, skipping API/scrape');
        return NextResponse.json({
            results: [{
                title: `YouTube Video (${directId})`,
                videoId: directId,
                thumbnail: `https://img.youtube.com/vi/${directId}/mqdefault.jpg`,
                author: 'YouTube',
            }]
        });
    }

    const searchQuery = normalizeQuery(query);
    if (!searchQuery) {
        return NextResponse.json({ results: [] });
    }

    // Try YouTube API first (if available and not over quota)
    if (!forceScrape) {
        const apiResults = await searchWithApi(searchQuery, roomId);
        if (apiResults && apiResults.length > 0) {
            return NextResponse.json({ results: apiResults, source: 'api' });
        }
    }

    // Fallback to scraping via yt-search with timeout protection
    try {
        const scrapedResults = await searchWithScraper(searchQuery, roomId);
        console.info('[search] using yt-search scraping', { forceScrape });
        return NextResponse.json({ results: scrapedResults, source: 'scraping' });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'unknown-error';
        console.error('yt-search Error:', message);
        const status = message === 'search-timeout' ? 504 : 500;
        return NextResponse.json({ results: [], error: 'search_failed', source: 'scraping_error' }, { status });
    }
}
