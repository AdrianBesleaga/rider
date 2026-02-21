/**
 * Ride History — localStorage-based ride tracking
 *
 * Stores completed rides with stats and knowledge consumed.
 */

import { CyclingData, NewsItem } from '../types';

export interface RideRecord {
    id: string;
    date: string;           // ISO date
    duration: number;        // seconds
    distance: number;        // meters
    calories: number;
    avgPower: number;
    avgHR: number;
    avgCadence: number;
    avgSpeed: number;
    newsConsumed: number;    // count of articles
    topTopics: string[];     // category labels
}

const STORAGE_KEY = 'stockrider_history';

export function getRideHistory(): RideRecord[] {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

export function saveRide(data: CyclingData, newsConsumed: NewsItem[]): RideRecord {
    const record: RideRecord = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        date: new Date().toISOString(),
        duration: data.elapsedTime,
        distance: data.distance,
        calories: Math.round(data.calories),
        avgPower: data.power,
        avgHR: data.heartRate,
        avgCadence: data.cadence,
        avgSpeed: data.speed,
        newsConsumed: newsConsumed.length,
        topTopics: [...new Set(newsConsumed.map(n => n.category))],
    };

    const history = getRideHistory();
    history.unshift(record);

    // Keep last 100 rides
    if (history.length > 100) history.length = 100;

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch {
        console.warn('Could not save ride to localStorage');
    }

    return record;
}

export function clearHistory(): void {
    localStorage.removeItem(STORAGE_KEY);
}

export function getTotalStats(history: RideRecord[]) {
    return {
        totalRides: history.length,
        totalDuration: history.reduce((a, r) => a + r.duration, 0),
        totalDistance: history.reduce((a, r) => a + r.distance, 0),
        totalCalories: history.reduce((a, r) => a + r.calories, 0),
        totalArticles: history.reduce((a, r) => a + r.newsConsumed, 0),
    };
}
