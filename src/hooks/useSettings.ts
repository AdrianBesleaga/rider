import { useState, useEffect } from 'react';
import { AppSettings, DEFAULT_SETTINGS } from '../components/Settings';

/**
 * Manages app settings with localStorage persistence.
 */
export function useSettings() {
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem('piwi_ride_settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch { return DEFAULT_SETTINGS; }
    });
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        try { localStorage.setItem('piwi_ride_settings', JSON.stringify(settings)); } catch { /* noop */ }
    }, [settings]);

    return { settings, setSettings, showSettings, setShowSettings, showHistory, setShowHistory };
}
