/**
 * Mock Data Services
 *
 * Provides realistic mock data for crypto, stocks, and news feeds.
 * Will be replaced with real API calls in Phase 2.
 */

import { CryptoTicker, StockQuote, NewsItem } from '../types';

// ─── Crypto Mock Data ───

function generateSparkline(base: number, volatility: number): number[] {
    const points: number[] = [];
    let price = base * (1 - volatility * 0.5);
    for (let i = 0; i < 24; i++) {
        price += (Math.random() - 0.48) * base * volatility * 0.1;
        price = Math.max(price, base * 0.7);
        points.push(Math.round(price * 100) / 100);
    }
    return points;
}

const CRYPTO_BASE: CryptoTicker[] = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 97542.30, change24h: 2.34, sparkline: [] },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3421.85, change24h: -1.12, sparkline: [] },
    { id: 'solana', symbol: 'SOL', name: 'Solana', price: 178.92, change24h: 5.67, sparkline: [] },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 0.6823, change24h: -0.89, sparkline: [] },
    { id: 'ripple', symbol: 'XRP', name: 'Ripple XRP', price: 2.74, change24h: 1.23, sparkline: [] },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.2534, change24h: 8.45, sparkline: [] },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', price: 7.12, change24h: -2.34, sparkline: [] },
    { id: 'avalanche', symbol: 'AVAX', name: 'Avalanche', price: 38.56, change24h: 3.21, sparkline: [] },
];

let cryptoState = CRYPTO_BASE.map(c => ({
    ...c,
    sparkline: generateSparkline(c.price, 0.05),
}));

export function getCryptoTickers(): CryptoTicker[] {
    // Simulate live price movement
    cryptoState = cryptoState.map(coin => {
        const change = (Math.random() - 0.48) * coin.price * 0.002;
        const newPrice = Math.max(0.01, coin.price + change);
        const sparkline = [...coin.sparkline.slice(1), newPrice];
        return {
            ...coin,
            price: Math.round(newPrice * 100) / 100,
            change24h: Math.round((coin.change24h + (Math.random() - 0.5) * 0.2) * 100) / 100,
            sparkline,
        };
    });
    return cryptoState;
}

// ─── Stock Mock Data ───

function generateStockHistory(base: number): { time: string; value: number }[] {
    const data: { time: string; value: number }[] = [];
    let price = base * 0.92;
    const now = new Date();
    for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        price += (Math.random() - 0.45) * base * 0.02;
        price = Math.max(price, base * 0.7);
        data.push({
            time: date.toISOString().split('T')[0],
            value: Math.round(price * 100) / 100,
        });
    }
    return data;
}

const STOCK_BASE: StockQuote[] = [
    { symbol: 'NVDA', name: 'NVIDIA Corp', price: 878.35, change: 12.40, changePercent: 1.43, volume: 42_500_000, high: 885.20, low: 862.10, data: [] },
    { symbol: 'AAPL', name: 'Apple Inc', price: 232.50, change: -1.20, changePercent: -0.51, volume: 58_200_000, high: 234.80, low: 230.10, data: [] },
    { symbol: 'MSFT', name: 'Microsoft Corp', price: 428.75, change: 5.30, changePercent: 1.25, volume: 22_800_000, high: 432.00, low: 422.50, data: [] },
    { symbol: 'GOOGL', name: 'Alphabet Inc', price: 178.92, change: 2.15, changePercent: 1.22, volume: 28_100_000, high: 180.30, low: 176.40, data: [] },
    { symbol: 'TSLA', name: 'Tesla Inc', price: 342.18, change: -8.45, changePercent: -2.41, volume: 95_400_000, high: 355.20, low: 338.90, data: [] },
    { symbol: 'META', name: 'Meta Platforms', price: 612.30, change: 7.80, changePercent: 1.29, volume: 18_600_000, high: 618.50, low: 604.20, data: [] },
];

let stockState = STOCK_BASE.map(s => ({
    ...s,
    data: generateStockHistory(s.price),
}));

export function getStockQuotes(): StockQuote[] {
    stockState = stockState.map(stock => {
        const change = (Math.random() - 0.48) * stock.price * 0.003;
        const newPrice = Math.max(1, stock.price + change);
        const newData = [...stock.data.slice(1), {
            time: new Date().toISOString().split('T')[0],
            value: Math.round(newPrice * 100) / 100,
        }];
        return {
            ...stock,
            price: Math.round(newPrice * 100) / 100,
            change: Math.round((newPrice - STOCK_BASE.find(s => s.symbol === stock.symbol)!.price) * 100) / 100,
            changePercent: Math.round(((newPrice - STOCK_BASE.find(s => s.symbol === stock.symbol)!.price) / STOCK_BASE.find(s => s.symbol === stock.symbol)!.price) * 10000) / 100,
            data: newData,
        };
    });
    return stockState;
}

// ─── News Mock Data ───

const NEWS_ITEMS: NewsItem[] = [
    {
        id: '1', title: 'OpenAI Announces GPT-5 with Reasoning Breakthrough',
        source: 'TechCrunch', url: '#', publishedAt: '2 min ago',
        category: 'ai', summary: 'The new model shows unprecedented performance on complex reasoning benchmarks, marking a significant leap forward.',
    },
    {
        id: '2', title: 'NVIDIA Earnings Crush Estimates — Data Center Revenue Up 150%',
        source: 'Bloomberg', url: '#', publishedAt: '15 min ago',
        category: 'tech', summary: 'Driven by AI chip demand, NVIDIA reports record revenue of $35.1B for the quarter.',
    },
    {
        id: '3', title: 'Bitcoin Breaks $100K Resistance After ETF Inflows Surge',
        source: 'CoinDesk', url: '#', publishedAt: '32 min ago',
        category: 'crypto', summary: 'Institutional buying through spot ETFs pushes Bitcoin past the psychological $100,000 mark.',
    },
    {
        id: '4', title: 'Y Combinator W26 Batch Spotlight: AI Agents for Enterprise',
        source: 'Hacker News', url: '#', publishedAt: '1 hr ago',
        category: 'startup', summary: 'This batch features 15+ startups building autonomous AI agents for workflow automation.',
    },
    {
        id: '5', title: 'Apple Vision Pro 2 Leaked — Thinner Design, M5 Chip',
        source: 'The Verge', url: '#', publishedAt: '2 hr ago',
        category: 'tech', summary: 'Leaked schematics show a 40% thinner form factor with the upcoming M5 chip and improved pass-through cameras.',
    },
    {
        id: '6', title: 'DeepMind Releases Gemini 3.0 — Multimodal AI Goes Open Source',
        source: 'Ars Technica', url: '#', publishedAt: '3 hr ago',
        category: 'ai', summary: 'Google DeepMind open-sources Gemini 3.0, enabling developers to build multimodal applications with unprecedented capability.',
    },
    {
        id: '7', title: 'Solana DeFi TVL Hits $20B — Ethereum Killer or Complement?',
        source: 'The Block', url: '#', publishedAt: '4 hr ago',
        category: 'crypto', summary: 'Solana ecosystem growth continues as total value locked in DeFi protocols reaches a new all-time high.',
    },
    {
        id: '8', title: 'Stripe Acquires AI Fintech Startup for $2.1B',
        source: 'Reuters', url: '#', publishedAt: '5 hr ago',
        category: 'startup', summary: 'The payments giant acquires an AI-powered fraud detection startup, signaling deeper AI integration.',
    },
    {
        id: '9', title: 'EU AI Act Implementation Begins — What Startups Need to Know',
        source: 'Wired', url: '#', publishedAt: '6 hr ago',
        category: 'ai', summary: 'The European Union begins enforcement of its landmark AI regulation, creating compliance requirements for AI companies.',
    },
    {
        id: '10', title: 'Andreessen Horowitz Raises $6.5B AI Fund',
        source: 'Fortune', url: '#', publishedAt: '7 hr ago',
        category: 'startup', summary: 'a16z raises its largest AI-focused fund, targeting foundational model companies and AI-native applications.',
    },
];

export function getNewsItems(): NewsItem[] {
    return NEWS_ITEMS;
}
