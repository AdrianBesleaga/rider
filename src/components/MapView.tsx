import React from 'react';
import { WorldRoute, CyclingData } from '../types';
import { WorldMap } from './WorldMap';
import { RiderPosition } from '../hooks/useWorldExplorer';

interface MapViewProps {
    worldRoute: WorldRoute | null;
    riderPos: RiderPosition;
    cyclingData: CyclingData;
    grade: number;
    speedMultiplier: number;
    facts: string[];
    factIndex: number;
    isAIFacts: boolean;
    onSetSpeed: (fn: (m: number) => number) => void;
    onBack: () => void;
}

const GLASS_PANEL: React.CSSProperties = {
    background: 'rgba(10,14,23,0.88)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid rgba(0,194,255,0.2)',
    borderRadius: 12,
    padding: '20px 24px',
    fontFamily: 'var(--font-mono)',
};

const STAT_ITEMS = [
    { icon: '⚡', key: 'power', label: 'POWER', format: (d: CyclingData) => `${Math.round(d.power)}W` },
    { icon: '🔄', key: 'cadence', label: 'RPM', format: (d: CyclingData) => `${Math.round(d.cadence)}` },
    { icon: '⛰️', key: 'grade', label: 'GRADE', format: (_d: CyclingData, g: number) => `${g.toFixed(1)}%` },
    { icon: '❤️', key: 'hr', label: 'BPM', format: (d: CyclingData) => `${Math.round(d.heartRate)}` },
    { icon: '🔥', key: 'cal', label: 'KCAL', format: (d: CyclingData) => `${Math.round(d.calories)}` },
];

export const MapView: React.FC<MapViewProps> = ({
    worldRoute, riderPos, cyclingData, grade, speedMultiplier,
    facts, factIndex, isAIFacts, onSetSpeed, onBack,
}) => {
    return (
        <div style={{ width: '100vw', height: '100vh', position: 'relative', background: 'var(--bg-primary)' }}>
            <WorldMap
                route={worldRoute}
                riderLat={riderPos.lat}
                riderLng={riderPos.lng}
                riderIndex={riderPos.index}
                progress={riderPos.progress}
                elevation={riderPos.elevation}
                speed={cyclingData.speed * speedMultiplier}
                multiplier={speedMultiplier}
            />

            {/* Speed HUD — top center */}
            <div style={{
                position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 1000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                background: 'rgba(10,14,23,0.75)', backdropFilter: 'blur(10px)',
                border: '1px solid rgba(0,194,255,0.2)', borderRadius: 16,
                padding: '10px 24px 8px',
            }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{
                        fontSize: 42, fontWeight: 900, fontFamily: 'var(--font-mono)',
                        color: 'var(--accent)',
                        textShadow: '0 0 20px rgba(0,194,255,0.5), 0 0 40px rgba(0,194,255,0.2)',
                        letterSpacing: -2,
                    }}>
                        {cyclingData.speed.toFixed(0)}
                    </span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        km/h
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <button onClick={() => onSetSpeed(m => Math.max(1, m / 2))} style={{
                        background: 'none', border: '1px solid rgba(0,194,255,0.3)', borderRadius: 4,
                        color: 'var(--accent)', width: 24, height: 24, fontSize: 14, cursor: 'pointer',
                    }}>−</button>
                    <span style={{ color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', minWidth: 34, textAlign: 'center' }}>
                        ×{speedMultiplier}
                    </span>
                    <button onClick={() => onSetSpeed(m => Math.min(1000, m * 2))} style={{
                        background: 'none', border: '1px solid rgba(0,194,255,0.3)', borderRadius: 4,
                        color: 'var(--accent)', width: 24, height: 24, fontSize: 14, cursor: 'pointer',
                    }}>+</button>
                </div>
            </div>
            {/* Cycling stats overlay */}
            <div style={{
                position: 'absolute', bottom: 80, left: 16, right: 16,
                display: 'flex', gap: 12, justifyContent: 'center', zIndex: 1000,
                pointerEvents: 'none',
            }}>
                {STAT_ITEMS.map(s => (
                    <div key={s.label} style={{
                        background: 'rgba(10,14,23,0.8)', backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(0,194,255,0.15)', borderRadius: 8,
                        padding: '8px 14px', textAlign: 'center', fontFamily: 'var(--font-mono)',
                    }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>{s.icon} {s.format(cyclingData, grade)}</div>
                        <div style={{ fontSize: 9, color: 'var(--text-muted)', letterSpacing: 1 }}>{s.label}</div>
                    </div>
                ))}
            </div>

            {/* Back button */}
            <button
                onClick={onBack}
                style={{
                    position: 'absolute', top: 16, left: 16, zIndex: 1000,
                    background: 'rgba(10,14,23,0.8)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(0,194,255,0.15)', borderRadius: 8,
                    padding: '8px 14px', color: 'var(--accent)', fontFamily: 'var(--font-mono)',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer',
                }}
            >
                ← Dashboard
            </button>

            {/* Facts Panel */}
            {worldRoute && (() => {
                if (facts.length === 0) {
                    return (
                        <div style={{ ...GLASS_PANEL, position: 'absolute', top: 120, right: 16, zIndex: 1000, width: 340 }}>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                                🌍 Exploring
                            </div>
                            <div style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                                Cycling through {worldRoute.name}, {worldRoute.country}
                            </div>
                        </div>
                    );
                }
                const current = facts[factIndex] || facts[facts.length - 1];
                return (
                    <div style={{ ...GLASS_PANEL, position: 'absolute', top: 120, right: 16, zIndex: 1000, width: 340 }}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>
                            {isAIFacts ? '🧠 AI Fact' : '🌍 Did you know?'}
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.5 }}>
                            {current}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
                            {factIndex + 1} / {facts.length}
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};
