import React from 'react';
import './HRZones.css';

interface HRZonesProps {
    heartRate: number;
    maxHR?: number;
}

interface Zone {
    name: string;
    min: number;
    max: number;
    color: string;
    label: string;
}

function getZones(maxHR: number): Zone[] {
    return [
        { name: 'Z1', min: 0, max: Math.round(maxHR * 0.6), color: 'var(--color-zone-1)', label: 'Recovery' },
        { name: 'Z2', min: Math.round(maxHR * 0.6), max: Math.round(maxHR * 0.7), color: 'var(--color-zone-2)', label: 'Endurance' },
        { name: 'Z3', min: Math.round(maxHR * 0.7), max: Math.round(maxHR * 0.8), color: 'var(--color-zone-3)', label: 'Tempo' },
        { name: 'Z4', min: Math.round(maxHR * 0.8), max: Math.round(maxHR * 0.9), color: 'var(--color-zone-4)', label: 'Threshold' },
        { name: 'Z5', min: Math.round(maxHR * 0.9), max: maxHR, color: 'var(--color-zone-5)', label: 'VO2 Max' },
    ];
}

export function getHRZoneColor(heartRate: number, maxHR = 190): string {
    const pct = heartRate / maxHR;
    if (pct < 0.6) return 'var(--color-zone-1)';
    if (pct < 0.7) return 'var(--color-zone-2)';
    if (pct < 0.8) return 'var(--color-zone-3)';
    if (pct < 0.9) return 'var(--color-zone-4)';
    return 'var(--color-zone-5)';
}

export function getHRZoneName(heartRate: number, maxHR = 190): string {
    const pct = heartRate / maxHR;
    if (pct < 0.6) return 'Recovery';
    if (pct < 0.7) return 'Endurance';
    if (pct < 0.8) return 'Tempo';
    if (pct < 0.9) return 'Threshold';
    return 'VO2 Max';
}

export const HRZones: React.FC<HRZonesProps> = ({ heartRate, maxHR = 190 }) => {
    const zones = getZones(maxHR);
    const activeColor = getHRZoneColor(heartRate, maxHR);
    const activeName = getHRZoneName(heartRate, maxHR);
    const pct = Math.min(100, (heartRate / maxHR) * 100);

    return (
        <div className="hr-zones">
            <div className="hr-zones-header">
                <span className="hr-zones-title">HR ZONE</span>
                <span className="hr-zones-current" style={{ color: activeColor }}>
                    {activeName}
                </span>
            </div>

            {/* Zone bar */}
            <div className="hr-zones-bar">
                {zones.map((zone) => (
                    <div
                        key={zone.name}
                        className="hr-zone-segment"
                        style={{
                            background: zone.color,
                            flex: zone.max - zone.min,
                            opacity: heartRate >= zone.min ? 1 : 0.25,
                        }}
                        title={`${zone.name}: ${zone.label} (${zone.min}-${zone.max} bpm)`}
                    />
                ))}
                {/* Needle */}
                <div
                    className="hr-zone-needle"
                    style={{ left: `${pct}%` }}
                />
            </div>

            {/* Zone labels */}
            <div className="hr-zones-labels">
                {zones.map((zone) => (
                    <span
                        key={zone.name}
                        className="hr-zone-label"
                        style={{
                            color: heartRate >= zone.min && heartRate < zone.max ? zone.color : 'var(--text-muted)',
                            fontWeight: heartRate >= zone.min && heartRate < zone.max ? 700 : 400,
                        }}
                    >
                        {zone.name}
                    </span>
                ))}
            </div>
        </div>
    );
};
