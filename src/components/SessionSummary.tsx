import React, { useMemo } from 'react';
import { CyclingData, NewsItem } from '../types';
import './SessionSummary.css';

interface SessionSummaryProps {
    data: CyclingData;
    newsConsumed: NewsItem[];
    onNewRide: () => void;
    onGoHome: () => void;
    onExportStrava?: () => void;
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
    if (meters >= 1000) return `${(meters / 1000).toFixed(1)} km`;
    return `${Math.round(meters)} m`;
}

export const SessionSummary: React.FC<SessionSummaryProps> = ({
    data,
    newsConsumed,
    onNewRide,
    onGoHome,
    onExportStrava,
}) => {
    const stats = useMemo(() => [
        { label: 'Duration', value: formatDuration(data.elapsedTime), icon: '⏱️' },
        { label: 'Distance', value: formatDistance(data.distance), icon: '📏' },
        { label: 'Avg Power', value: `${data.power}W`, icon: '🔋' },
        { label: 'Calories', value: `${Math.round(data.calories)}`, icon: '🔥' },
        { label: 'Avg HR', value: `${data.heartRate} bpm`, icon: '❤️' },
        { label: 'Avg Cadence', value: `${data.cadence} rpm`, icon: '🚴' },
    ], [data]);

    const handleShare = async () => {
        const text = [
            `🚴 Stock Rider Session`,
            `⏱️ ${formatDuration(data.elapsedTime)} | 🔥 ${Math.round(data.calories)} kcal | 📏 ${formatDistance(data.distance)}`,
            `📰 Learned about: ${newsConsumed.slice(0, 3).map(n => n.title.slice(0, 50)).join(', ')}`,
            `\nExercise your body AND your mind → stockrider.app`,
        ].join('\n');

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Stock Rider Session', text });
            } catch { /* user cancelled */ }
        } else {
            await navigator.clipboard.writeText(text);
            alert('Copied to clipboard!');
        }
    };

    return (
        <div className="session-summary">
            <div className="session-summary-card">
                <div className="session-summary-header">
                    <div className="session-summary-icon">🏁</div>
                    <h1>Ride Complete</h1>
                    <p className="session-summary-subtitle">Great session — body AND mind leveled up.</p>
                </div>

                {/* Stats Grid */}
                <div className="session-stats-grid">
                    {stats.map((s) => (
                        <div className="session-stat" key={s.label}>
                            <span className="session-stat-icon">{s.icon}</span>
                            <span className="session-stat-value">{s.value}</span>
                            <span className="session-stat-label">{s.label}</span>
                        </div>
                    ))}
                </div>

                {/* Knowledge consumed */}
                {newsConsumed.length > 0 && (
                    <div className="session-knowledge">
                        <h3>🧠 Knowledge Gained</h3>
                        <ul>
                            {newsConsumed.slice(0, 5).map((n) => (
                                <li key={n.id}>
                                    <span className="session-knowledge-cat">{n.category.toUpperCase()}</span>
                                    {n.title}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Actions */}
                <div className="session-actions">
                    <button className="landing-btn-primary" onClick={onNewRide}>
                        🚴 New Ride
                    </button>
                    <button className="landing-btn-secondary" onClick={handleShare}>
                        📤 Share
                    </button>
                    {onExportStrava && (
                        <button className="landing-btn-secondary" onClick={onExportStrava}>
                            📋 Export to Strava
                        </button>
                    )}
                    <button className="landing-btn-secondary" onClick={onGoHome}>
                        🏠 Home
                    </button>
                </div>
            </div>
        </div>
    );
};
