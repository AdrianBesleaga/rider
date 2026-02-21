/**
 * API Configuration
 *
 * Centralised endpoints and settings for all external data sources.
 * CoinGecko free tier: no API key, 10-30 req/min.
 * RSS feeds via public CORS proxies for dev; direct in production.
 */

export const API = {
    crypto: {
        /** CoinGecko /coins/markets — free, no key */
        marketsUrl:
            'https://api.coingecko.com/api/v3/coins/markets',
        /** Coins we track */
        ids: ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple', 'dogecoin', 'polkadot', 'avalanche-2'],
        /** Polling interval ms */
        interval: 30_000,
    },

    news: {
        /** Free RSS-to-JSON proxy (no key needed, generous limits) */
        rssProxyUrl: 'https://api.rss2json.com/v1/api.json',
        feeds: [
            { url: 'https://techcrunch.com/feed/', category: 'tech' as const },
            { url: 'https://feeds.arstechnica.com/arstechnica/technology-lab', category: 'ai' as const },
            { url: 'https://cointelegraph.com/rss', category: 'crypto' as const },
        ],
        /** Polling interval ms */
        interval: 120_000,
    },

    /** Use mock data instead of real APIs (auto-true in dev when APIs unreachable) */
    useMock: false,
} as const;
