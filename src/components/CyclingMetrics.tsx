import React from 'react';
import { CyclingData, ConnectionStatus } from '../types';
import './CyclingMetrics.css';

interface Props {
    data: CyclingData;
    status: ConnectionStatus;
    onConnect: () => void;
    onDisconnect: () => void;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function formatDistance(meters: number): string {
    if (meters < 1000) return `${meters}m`;
    return `${(meters / 1000).toFixed(1)}km`;
}

function getHRZone(hr: number): { zone: string; color: string } {
    if (hr < 120) return { zone: 'Z1', color: 'var(--color-zone-1)' };
    if (hr < 140) return { zone: 'Z2', color: 'var(--color-zone-2)' };
    if (hr < 155) return { zone: 'Z3', color: 'var(--color-zone-3)' };
    if (hr < 170) return { zone: 'Z4', color: 'var(--color-zone-4)' };
    return { zone: 'Z5', color: 'var(--color-zone-5)' };
}

export const CyclingMetrics: React.FC<Props> = ({ data, status, onConnect, onDisconnect }) => {
    const hrZone = getHRZone(data.heartRate);

    return (
        <div className="cycling-metrics">
            <div className="metrics-header">
                <div className={`connection-indicator ${status}`}>
                    <span className="indicator-dot" />
                    <span className="indicator-text">
                        {status === 'connected' ? 'LIVE' : status === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
                    </span>
                </div>
                {status === 'disconnected' ? (
                    <button className="connect-btn" onClick={onConnect}>
                        <span className="btn-icon">⚡</span> Connect
                    </button>
                ) : (
                    <button className="disconnect-btn" onClick={onDisconnect}>
                        Disconnect
                    </button>
                )}
            </div>

            <div className="metric-card primary">
                <div className="metric-label">POWER</div>
                <div className="metric-value">
                    <span className="metric-number">{data.power}</span>
                    <span className="metric-unit">W</span>
                </div>
                <div className="power-bar">
                    <div
                        className="power-fill"
                        style={{ width: `${Math.min(100, (data.power / 400) * 100)}%` }}
                    />
                </div>
            </div>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-label">CADENCE</div>
                    <div className="metric-value">
                        <span className="metric-number">{data.cadence}</span>
                        <span className="metric-unit">rpm</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">
                        HEART RATE
                        <span className="hr-zone" style={{ background: hrZone.color }}>{hrZone.zone}</span>
                    </div>
                    <div className="metric-value" style={{ color: hrZone.color }}>
                        <span className="metric-number">{data.heartRate}</span>
                        <span className="metric-unit">bpm</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">SPEED</div>
                    <div className="metric-value">
                        <span className="metric-number">{data.speed.toFixed(1)}</span>
                        <span className="metric-unit">km/h</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">TIME</div>
                    <div className="metric-value">
                        <span className="metric-number mono">{formatTime(data.elapsedTime)}</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">DISTANCE</div>
                    <div className="metric-value">
                        <span className="metric-number">{formatDistance(data.distance)}</span>
                    </div>
                </div>

                <div className="metric-card">
                    <div className="metric-label">CALORIES</div>
                    <div className="metric-value">
                        <span className="metric-number">{data.calories}</span>
                        <span className="metric-unit">kcal</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
