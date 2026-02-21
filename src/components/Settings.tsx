import React, { useState } from 'react';
import type { RideStyle } from '../types';
import './Settings.css';

export interface AppSettings {
    useMockData: boolean;
    useMockBle: boolean;
    rideStyle: RideStyle;
    aiCoach: boolean;
    voiceBriefing: boolean;
    obsOverlay: boolean;
    customFeeds: string[];
    founderDashboard: {
        enabled: boolean;
        companyName: string;
        metrics: string[];
    };
}

export const DEFAULT_SETTINGS: AppSettings = {
    useMockData: false,
    useMockBle: true,
    rideStyle: 'road',
    aiCoach: false,
    voiceBriefing: false,
    obsOverlay: false,
    customFeeds: [],
    founderDashboard: {
        enabled: false,
        companyName: '',
        metrics: [],
    },
};

interface SettingsProps {
    settings: AppSettings;
    onUpdate: (settings: AppSettings) => void;
    onClose: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ settings, onUpdate, onClose }) => {
    const [newFeed, setNewFeed] = useState('');
    const [newMetric, setNewMetric] = useState('');

    const toggle = (key: keyof AppSettings) => {
        onUpdate({ ...settings, [key]: !settings[key] });
    };

    const addFeed = () => {
        if (!newFeed.trim()) return;
        onUpdate({
            ...settings,
            customFeeds: [...settings.customFeeds, newFeed.trim()],
        });
        setNewFeed('');
    };

    const removeFeed = (idx: number) => {
        onUpdate({
            ...settings,
            customFeeds: settings.customFeeds.filter((_, i) => i !== idx),
        });
    };

    const addMetric = () => {
        if (!newMetric.trim()) return;
        onUpdate({
            ...settings,
            founderDashboard: {
                ...settings.founderDashboard,
                metrics: [...settings.founderDashboard.metrics, newMetric.trim()],
            },
        });
        setNewMetric('');
    };

    return (
        <div className="settings-overlay" onClick={onClose}>
            <div className="settings-panel" onClick={e => e.stopPropagation()}>
                <div className="settings-header">
                    <h2>⚙️ Settings</h2>
                    <button className="settings-close" onClick={onClose}>✕</button>
                </div>

                {/* Connection */}
                <section className="settings-section">
                    <h3>🔗 Connection</h3>
                    <label className="settings-toggle">
                        <span>Use real Bluetooth trainer</span>
                        <input type="checkbox" checked={!settings.useMockBle} onChange={() => toggle('useMockBle')} />
                        <span className="settings-switch" />
                    </label>
                    <p className="settings-hint" style={{ fontSize: 12, color: 'var(--text-muted)', margin: '4px 0 12px', lineHeight: 1.4 }}>
                        {settings.useMockBle
                            ? '🎮 Demo mode — simulated cycling data is generated automatically.'
                            : '📡 Real mode — pairs with your Bluetooth trainer via Web Bluetooth API.'}
                    </p>
                    <label className="settings-toggle">
                        <span>Use mock data feeds</span>
                        <input type="checkbox" checked={settings.useMockData} onChange={() => toggle('useMockData')} />
                        <span className="settings-switch" />
                    </label>

                    <div className="settings-ride-style">
                        <span className="settings-ride-label">Ride style</span>
                        <div className="settings-segment">
                            <button
                                className={`settings-seg-btn ${settings.rideStyle === 'road' ? 'active' : ''}`}
                                onClick={() => onUpdate({ ...settings, rideStyle: 'road' })}
                            >
                                🚴 Road
                            </button>
                            <button
                                className={`settings-seg-btn ${settings.rideStyle === 'mtb' ? 'active' : ''}`}
                                onClick={() => onUpdate({ ...settings, rideStyle: 'mtb' })}
                            >
                                🚵 MTB
                            </button>
                        </div>
                    </div>
                </section>

                {/* Features */}
                <section className="settings-section">
                    <h3>🎯 Features</h3>
                    <label className="settings-toggle">
                        <span>🧠 AI Coach (in-browser, requires WebGPU)</span>
                        <input type="checkbox" checked={settings.aiCoach} onChange={() => toggle('aiCoach')} />
                        <span className="settings-switch" />
                    </label>
                    <label className="settings-toggle">
                        <span>Voice briefing (TTS reads news)</span>
                        <input type="checkbox" checked={settings.voiceBriefing} onChange={() => toggle('voiceBriefing')} />
                        <span className="settings-switch" />
                    </label>
                    <label className="settings-toggle">
                        <span>OBS overlay mode (transparent bg)</span>
                        <input type="checkbox" checked={settings.obsOverlay} onChange={() => toggle('obsOverlay')} />
                        <span className="settings-switch" />
                    </label>
                </section>

                {/* Custom RSS Feeds */}
                <section className="settings-section">
                    <h3>📡 Custom RSS Feeds</h3>
                    <div className="settings-add-row">
                        <input
                            type="text"
                            placeholder="https://example.com/feed.xml"
                            value={newFeed}
                            onChange={e => setNewFeed(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && addFeed()}
                            className="settings-input"
                        />
                        <button className="settings-add-btn" onClick={addFeed}>Add</button>
                    </div>
                    {settings.customFeeds.length > 0 && (
                        <ul className="settings-list">
                            {settings.customFeeds.map((feed, i) => (
                                <li key={i}>
                                    <span className="settings-list-text">{feed}</span>
                                    <button className="settings-remove-btn" onClick={() => removeFeed(i)}>✕</button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                {/* Founder Mode */}
                <section className="settings-section">
                    <h3>🚀 Founder Mode</h3>
                    <label className="settings-toggle">
                        <span>Enable founder dashboard</span>
                        <input
                            type="checkbox"
                            checked={settings.founderDashboard.enabled}
                            onChange={() => onUpdate({
                                ...settings,
                                founderDashboard: {
                                    ...settings.founderDashboard,
                                    enabled: !settings.founderDashboard.enabled,
                                },
                            })}
                        />
                        <span className="settings-switch" />
                    </label>
                    {settings.founderDashboard.enabled && (
                        <>
                            <input
                                type="text"
                                placeholder="Company name (e.g. piwi.ai)"
                                value={settings.founderDashboard.companyName}
                                onChange={e => onUpdate({
                                    ...settings,
                                    founderDashboard: {
                                        ...settings.founderDashboard,
                                        companyName: e.target.value,
                                    },
                                })}
                                className="settings-input"
                                style={{ marginTop: 8 }}
                            />
                            <div className="settings-add-row" style={{ marginTop: 8 }}>
                                <input
                                    type="text"
                                    placeholder="Add metric (e.g. MRR, DAU, Churn)"
                                    value={newMetric}
                                    onChange={e => setNewMetric(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && addMetric()}
                                    className="settings-input"
                                />
                                <button className="settings-add-btn" onClick={addMetric}>Add</button>
                            </div>
                            {settings.founderDashboard.metrics.length > 0 && (
                                <div className="settings-metrics-tags">
                                    {settings.founderDashboard.metrics.map((m, i) => (
                                        <span key={i} className="settings-metric-tag">
                                            {m}
                                            <button onClick={() => onUpdate({
                                                ...settings,
                                                founderDashboard: {
                                                    ...settings.founderDashboard,
                                                    metrics: settings.founderDashboard.metrics.filter((_, j) => j !== i),
                                                },
                                            })}>✕</button>
                                        </span>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};
