import React, { createContext, useContext, useState, useEffect, useRef, useCallback, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { NewsItem, ContentTab, CyclingData, PowerSample, ConnectionStatus } from '../types';
import { fetchNewsItems } from '../services/dataService';
import { getNewsItems as getMockNews } from '../services/mockData';
import { getRideHistory, RideRecord } from '../services/rideHistory';
import { startVoiceBriefing, stopVoiceBriefing } from '../services/voiceBriefing';
import { WebLLMService, WebLLMProgress } from '../services/webLLMService';
import { useSettings } from '../hooks/useSettings';
import { useCyclingSession } from '../hooks/useCyclingSession';
import { useWorldExplorer } from '../hooks/useWorldExplorer';

interface AppContextType {
    // Settings
    settings: ReturnType<typeof useSettings>['settings'];
    setSettings: ReturnType<typeof useSettings>['setSettings'];
    showSettings: boolean;
    setShowSettings: (v: boolean) => void;
    showHistory: boolean;
    setShowHistory: (v: boolean) => void;

    // Session
    cyclingData: CyclingData;
    connectionStatus: ConnectionStatus;
    powerSamples: PowerSample[];
    newsConsumed: NewsItem[];
    session: ReturnType<typeof useCyclingSession>;

    // Explorer
    explorer: ReturnType<typeof useWorldExplorer>;

    // AI
    aiServiceRef: React.MutableRefObject<WebLLMService | null>;
    aiProgress: WebLLMProgress;

    // News
    newsItems: NewsItem[];
    activeTab: ContentTab;
    setActiveTab: (tab: ContentTab) => void;
    rideHistory: RideRecord[];

    // Actions
    startRide: (mock: boolean) => void;
    handleEndRide: () => void;
    handleNewRide: () => void;

    // OBS
    obsClass: string;
}

const AppContext = createContext<AppContextType | null>(null);

export function useAppContext() {
    const ctx = useContext(AppContext);
    if (!ctx) throw new Error('useAppContext must be used within AppProvider');
    return ctx;
}

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const navigate = useNavigate();

    // ─── Hooks ───
    const { settings, setSettings, showSettings, setShowSettings, showHistory, setShowHistory } = useSettings();
    const session = useCyclingSession();
    const { cyclingData, connectionStatus, powerSamples, newsConsumed, setNewsConsumed } = session;

    // ─── AI Coach ───
    const aiServiceRef = useRef<WebLLMService | null>(null);
    const [aiProgress, setAiProgress] = useState<WebLLMProgress>({
        status: 'idle', progress: 0, message: '',
    });

    useEffect(() => {
        if (settings.aiCoach) {
            const service = new WebLLMService({ onProgress: setAiProgress });
            aiServiceRef.current = service;
            service.init();
            return () => {
                service.dispose();
                aiServiceRef.current = null;
                setAiProgress({ status: 'idle', progress: 0, message: '' });
            };
        } else {
            if (aiServiceRef.current) {
                aiServiceRef.current.dispose();
                aiServiceRef.current = null;
                setAiProgress({ status: 'idle', progress: 0, message: '' });
            }
        }
    }, [settings.aiCoach]);

    // ─── World Explorer ───
    const explorer = useWorldExplorer({
        active: true,
        cyclingData,
        aiServiceRef,
    });

    // ─── News feed ───
    const [newsItems, setNewsItems] = useState<NewsItem[]>(getMockNews());
    const [activeTab, setActiveTab] = useState<ContentTab>('explorer');
    const [rideHistory, setRideHistory] = useState<RideRecord[]>(getRideHistory());

    useEffect(() => {
        if (settings.useMockData) {
            setNewsConsumed(getMockNews());
            return;
        }
        fetchNewsItems().then((items) => {
            setNewsItems(items);
            setNewsConsumed(items);
        }).catch(console.error);
    }, [settings.useMockData]);

    // ─── Voice briefing ───
    useEffect(() => {
        if (settings.voiceBriefing && newsItems.length > 0) {
            startVoiceBriefing(newsItems);
        }
        return () => stopVoiceBriefing();
    }, [settings.voiceBriefing]);

    // ─── Actions ───
    const startRide = useCallback((mock: boolean) => {
        session.startRide(mock);
        navigate('/ride');
    }, [session.startRide, navigate]);

    const handleEndRide = useCallback(() => {
        const record = session.endRide();
        setRideHistory(prev => [record, ...prev]);
        explorer.reset();
        navigate('/summary');
    }, [session.endRide, explorer.reset, navigate]);

    const handleNewRide = useCallback(() => {
        session.resetSession();
        explorer.reset();
        startRide(settings.useMockBle);
    }, [startRide, session.resetSession, explorer.reset, settings.useMockBle]);

    const obsClass = settings.obsOverlay ? ' obs-overlay' : '';

    const value: AppContextType = {
        settings, setSettings, showSettings, setShowSettings, showHistory, setShowHistory,
        cyclingData, connectionStatus, powerSamples, newsConsumed, session,
        explorer,
        aiServiceRef, aiProgress,
        newsItems, activeTab, setActiveTab, rideHistory,
        startRide, handleEndRide, handleNewRide,
        obsClass,
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
