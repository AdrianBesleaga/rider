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

export type ContentTab = 'news' | 'spotlight' | 'learn';

export type RideStyle = 'road' | 'mtb';

export type FactCategory = RideStyle | 'motivation';
