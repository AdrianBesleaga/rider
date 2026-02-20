// ─── Cycling / BLE types ───

export interface CyclingData {
    power: number;        // watts
    cadence: number;      // rpm
    speed: number;        // km/h
    heartRate: number;    // bpm
    distance: number;     // meters
    calories: number;     // kcal
    elapsedTime: number;  // seconds
}

export interface PowerSample {
    time: number;   // elapsed seconds
    power: number;  // watts
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected';

// ─── Financial data types ───

export interface CryptoTicker {
    id: string;
    symbol: string;
    name: string;
    price: number;
    change24h: number;        // percent
    sparkline: number[];      // last 24h prices
}

export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;           // absolute
    changePercent: number;    // percent
    volume: number;
    high: number;
    low: number;
    data: { time: string; value: number }[];
}

// ─── News types ───

export interface NewsItem {
    id: string;
    title: string;
    source: string;
    url: string;
    publishedAt: string;
    category: 'tech' | 'ai' | 'crypto' | 'startup';
    summary: string;
}

// ─── Startup types ───

export interface StartupInfo {
    name: string;
    tagline: string;
    description: string;
    founded: string;
    funding: string;
    competitors: string[];
    category: string;
}

// ─── App state ───

export type ContentTab = 'charts' | 'news' | 'spotlight';
