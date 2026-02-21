/**
 * Data Service — RSS news fetching
 *
 * Fetches news from RSS feeds via a free CORS proxy.
 * Falls back to mock data if feeds are unreachable.
 */

import { NewsItem } from '../types';
import { API } from './apiConfig';
import { getNewsItems as getMockNews } from './mockData';

// ─── News (RSS → JSON) ───

interface RssItem {
    title: string;
    link: string;
    pubDate: string;
    description: string;
    author?: string;
}

interface RssResponse {
    status: string;
    feed: { title: string };
    items: RssItem[];
}

function stripHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || div.innerText || '').trim().slice(0, 200);
}

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 60) return `${mins} min ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs} hr ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

export async function fetchNewsItems(): Promise<NewsItem[]> {
    if (API.useMock) return getMockNews();

    try {
        const allItems: NewsItem[] = [];
        let idCounter = 1;

        const results = await Promise.allSettled(
            API.news.feeds.map(async (feed) => {
                const params = new URLSearchParams({
                    rss_url: feed.url,
                    count: '5',
                });
                const res = await fetch(`${API.news.rssProxyUrl}?${params}`);
                if (!res.ok) return [];
                const data: RssResponse = await res.json();
                if (data.status !== 'ok') return [];
                return data.items.map((item) => ({
                    id: String(idCounter++),
                    title: item.title,
                    source: data.feed.title,
                    url: item.link,
                    publishedAt: timeAgo(item.pubDate),
                    category: feed.category,
                    summary: stripHtml(item.description),
                }));
            }),
        );

        for (const r of results) {
            if (r.status === 'fulfilled' && Array.isArray(r.value)) {
                allItems.push(...r.value);
            }
        }

        if (allItems.length === 0) throw new Error('No news items returned');
        console.log(`[News] Fetched ${allItems.length} items from ${API.news.feeds.length} RSS feeds`);
        return allItems.sort(
            (a, b) => (a.publishedAt > b.publishedAt ? 1 : -1),
        );
    } catch (err) {
        console.warn('⚡ News feeds unavailable, using mock:', err);
        return getMockNews();
    }
}
