import React from 'react';
import { RideRecord, getTotalStats } from '../services/rideHistory';
import './RideHistory.css';

interface RideHistoryProps {
    history: RideRecord[];
    onClose: () => void;
}

function formatDuration(s: number): string {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
}

function formatDistance(m: number): string {
    return m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`;
}

function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export const RideHistory: React.FC<RideHistoryProps> = ({ history, onClose }) => {
    const totals = getTotalStats(history);

    return (
        <div className="history-overlay" onClick={onClose}>
            <div className="history-panel" onClick={e => e.stopPropagation()}>
                <div className="history-header">
                    <h2>📊 Ride History</h2>
                    <button className="settings-close" onClick={onClose}>✕</button>
                </div>

                {/* Totals banner */}
                <div className="history-totals">
                    <div className="history-total">
                        <span className="history-total-value">{totals.totalRides}</span>
                        <span className="history-total-label">Rides</span>
                    </div>
                    <div className="history-total">
                        <span className="history-total-value">{formatDuration(totals.totalDuration)}</span>
                        <span className="history-total-label">Total Time</span>
                    </div>
                    <div className="history-total">
                        <span className="history-total-value">{formatDistance(totals.totalDistance)}</span>
                        <span className="history-total-label">Distance</span>
                    </div>
                    <div className="history-total">
                        <span className="history-total-value">{totals.totalCalories.toLocaleString()}</span>
                        <span className="history-total-label">Calories</span>
                    </div>
                    <div className="history-total">
                        <span className="history-total-value">{totals.totalArticles}</span>
                        <span className="history-total-label">Articles Read</span>
                    </div>
                </div>

                {/* Ride list */}
                {history.length === 0 ? (
                    <div className="history-empty">
                        <p>No rides yet. Start your first ride!</p>
                    </div>
                ) : (
                    <div className="history-list">
                        {history.map((ride) => (
                            <div key={ride.id} className="history-ride">
                                <div className="history-ride-date">{formatDate(ride.date)}</div>
                                <div className="history-ride-stats">
                                    <span>⏱️ {formatDuration(ride.duration)}</span>
                                    <span>🔋 {ride.avgPower}W</span>
                                    <span>❤️ {ride.avgHR} bpm</span>
                                    <span>🔥 {ride.calories} kcal</span>
                                    <span>📏 {formatDistance(ride.distance)}</span>
                                </div>
                                {ride.newsConsumed > 0 && (
                                    <div className="history-ride-knowledge">
                                        📰 {ride.newsConsumed} articles • {ride.topTopics.join(', ')}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
