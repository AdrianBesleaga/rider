/**
 * API Configuration
 *
 * RSS feeds for news content. Uses a free CORS proxy for dev.
 */

export const API = {
    news: {
        /** Free RSS-to-JSON proxy (no key needed, generous limits) */
        rssProxyUrl: 'https://api.rss2json.com/v1/api.json',
        feeds: [
            { url: 'https://techcrunch.com/feed/', category: 'tech' as const },
            { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', category: 'ai' as const },
            { url: 'https://cointelegraph.com/rss', category: 'crypto' as const },
        ],
    },

    /** Use mock data instead of real APIs */
    useMock: false,
} as const;
