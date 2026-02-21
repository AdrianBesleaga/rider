import React from 'react';
import { CyclingData, ConnectionStatus } from '../types';
import './HUD.css';

/**
 * Compact HUD overlay for the 3D Rider view
 * Transparent bar at the bottom with essential metrics
 */

interface HUDProps {
    data: CyclingData;
    status: ConnectionStatus;
    onConnect: () => void;
    onSwitchView: () => void;
    onEndRide?: () => void;
    onGoHome?: () => void;
}

function formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    return `${m}:${String(s).padStart(2, '0')}`;
}

export const HUD: React.FC<HUDProps> = ({ data, status, onConnect, onSwitchView, onEndRide, onGoHome }) => {
    return (
        <div className="hud-overlay">
            {/* Top bar */}
            <div className="hud-top">
                <div className="hud-brand" onClick={onGoHome} style={{ cursor: onGoHome ? 'pointer' : 'default' }} title="Back to home">
                    <span className="hud-brand-icon">🚴</span>
                    <span className="hud-brand-name">RIDE</span>
                </div>
                <div className="hud-actions">
                    {status === 'disconnected' && (
                        <button className="hud-btn hud-connect-btn" onClick={onConnect}>
                            ⚡ Connect
                        </button>
                    )}
                    <button className="hud-btn" onClick={onSwitchView}>
                        📊 Dashboard
                    </button>
                    {onEndRide && (
                        <button className="hud-btn hud-end-btn" onClick={onEndRide}>
                            🏁 End Ride
                        </button>
                    )}
                </div>
            </div>

            {/* Bottom metrics bar */}
            <div className="hud-bottom">
                <div className="hud-metric">
                    <span className="hud-metric-value hud-power">{data.power}</span>
                    <span className="hud-metric-unit">W</span>
                </div>
                <div className="hud-divider" />
                <div className="hud-metric">
                    <span className="hud-metric-icon">❤️</span>
                    <span className="hud-metric-value">{data.heartRate}</span>
                    <span className="hud-metric-unit">bpm</span>
                </div>
                <div className="hud-divider" />
                <div className="hud-metric">
                    <span className="hud-metric-value">{data.cadence}</span>
                    <span className="hud-metric-unit">rpm</span>
                </div>
                <div className="hud-divider" />
                <div className="hud-metric">
                    <span className="hud-metric-value">{data.speed.toFixed(1)}</span>
                    <span className="hud-metric-unit">km/h</span>
                </div>
                <div className="hud-divider" />
                <div className="hud-metric">
                    <span className="hud-metric-value">{formatTime(data.elapsedTime)}</span>
                </div>
                <div className="hud-divider" />
                <div className="hud-metric">
                    <span className="hud-metric-value">{data.calories}</span>
                    <span className="hud-metric-unit">kcal</span>
                </div>

                {/* Connection status */}
                <div className="hud-status">
                    <span className={`hud-dot ${status}`} />
                    <span className="hud-status-text">
                        {status === 'connected' ? 'LIVE' : status === 'connecting' ? '...' : 'OFF'}
                    </span>
                </div>
            </div>
        </div>
    );
};
