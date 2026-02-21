import React, { useState, useEffect, useRef, useCallback } from 'react';
import { NewsItem, ContentTab } from './types';
import { fetchNewsItems } from './services/dataService';
import { getNewsItems as getMockNews } from './services/mockData';
import { getRideHistory, RideRecord } from './services/rideHistory';
import { startVoiceBriefing, stopVoiceBriefing } from './services/voiceBriefing';
import { WebLLMService, WebLLMProgress } from './services/webLLMService';

// Components
import { CyclingMetrics } from './components/CyclingMetrics';
import { PowerGraph } from './components/PowerGraph';
import { NewsFeed } from './components/NewsFeed';
import { LandingPage } from './components/LandingPage';
import { SessionSummary } from './components/SessionSummary';
import { Flashcards } from './components/Flashcards';
import { HRZones } from './components/HRZones';
import { FounderDashboard } from './components/FounderDashboard';
import { Settings } from './components/Settings';
import { RideHistory } from './components/RideHistory';
import { MotivationalBanner } from './components/MotivationalBanner';
import { AILoadingOverlay } from './components/AILoadingOverlay';
import { WorldMap } from './components/WorldMap';
import { MapView } from './components/MapView';

// Hooks
import { useSettings } from './hooks/useSettings';
import { useCyclingSession } from './hooks/useCyclingSession';
import { useWorldExplorer } from './hooks/useWorldExplorer';

type AppView = 'landing' | 'dashboard' | 'map' | 'summary';

export const App: React.FC = () => {
    const [view, setView] = useState<AppView>('landing');

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
        active: view === 'map' || view === 'dashboard',
        cyclingData,
        bleRef: session.bleRef,
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
        if (settings.voiceBriefing && newsItems.length > 0 && (view === 'map' || view === 'dashboard')) {
            startVoiceBriefing(newsItems);
        }
        return () => stopVoiceBriefing();
    }, [settings.voiceBriefing, view]);

    // ─── Actions ───
    const startRide = useCallback((mock: boolean) => {
        session.startRide(mock);
        setView('map');
    }, [session.startRide]);

    const handleEndRide = useCallback(() => {
        const record = session.endRide();
        setRideHistory(prev => [record, ...prev]);
        explorer.reset();
        setView('summary');
    }, [session.endRide, explorer.reset]);

    const handleNewRide = useCallback(() => {
        session.resetSession();
        explorer.reset();
        startRide(settings.useMockBle);
    }, [startRide, session.resetSession, explorer.reset, settings.useMockBle]);

    const obsClass = settings.obsOverlay ? ' obs-overlay' : '';

    // ─── Landing Page ───
    if (view === 'landing') {
        return (
            <LandingPage
                onStartRide={() => startRide(false)}
                onStartDemo={() => {
                    setSettings(s => ({ ...s, useMockData: true, useMockBle: true }));
                    startRide(true);
                }}
            />
        );
    }

    // ─── Session Summary ───
    if (view === 'summary') {
        return (
            <SessionSummary
                data={cyclingData}
                newsConsumed={newsConsumed}
                onNewRide={handleNewRide}
                onGoHome={() => {
                    session.resetSession();
                    setView('landing');
                }}
                onExportStrava={session.exportStrava}
            />
        );
    }

    // ─── Map View ───
    if (view === 'map') {
        return (
            <MapView
                worldRoute={explorer.worldRoute}
                riderPos={explorer.riderPos}
                cyclingData={cyclingData}
                grade={explorer.currentGrade}
                speedMultiplier={explorer.speedMultiplier}
                facts={explorer.facts}
                factIndex={explorer.currentFactIndex}
                isAIFacts={explorer.isAIFacts}
                onSetSpeed={explorer.setSpeedMultiplier}
                onBack={() => setView('dashboard')}
            />
        );
    }

    // ─── Dashboard View ───
    return (
        <div className={`app${obsClass}`}>
            {/* Top Bar */}
            <header className="top-bar">
                <div className="brand" onClick={() => { session.resetSession(); setView('landing'); }} style={{ cursor: 'pointer' }} title="Back to home">
                    <span className="brand-icon">🚴</span>
                    <span className="brand-name">RIDE</span>
                    <span className="brand-tag">BETA</span>
                </div>
                <div className="top-bar-actions">
                    <button className="view-toggle-btn" onClick={() => setView('map')} title="World map">
                        🌍 Map
                    </button>
                    <button className="view-toggle-btn" onClick={() => setShowHistory(true)} title="Ride history">
                        📊
                    </button>
                    <button className="view-toggle-btn" onClick={() => setShowSettings(true)} title="Settings">
                        ⚙️
                    </button>
                    <button className="view-toggle-btn end-ride-btn" onClick={handleEndRide} title="End ride">
                        🏁 End
                    </button>
                </div>
            </header>
            <MotivationalBanner
                rideStyle={settings.rideStyle}
                cyclingData={cyclingData}
                aiService={aiServiceRef.current}
            />
            <AILoadingOverlay progress={aiProgress} />

            {/* Main Content */}
            <div className="main-content">
                {/* Left Panel — Cycling Metrics */}
                <aside className="left-panel">
                    <div className="left-panel-top">
                        <CyclingMetrics
                            data={cyclingData}
                            status={connectionStatus}
                            onConnect={session.connect}
                            onDisconnect={session.disconnect}
                        />
                        <HRZones heartRate={cyclingData.heartRate} />
                        {settings.founderDashboard.enabled && (
                            <FounderDashboard
                                companyName={settings.founderDashboard.companyName}
                                metrics={settings.founderDashboard.metrics}
                            />
                        )}
                    </div>
                    <div className="left-panel-bottom">
                        <PowerGraph samples={powerSamples} />
                    </div>
                </aside>

                {/* Right Panel — Data Feeds */}
                <main className="right-panel">
                    <nav className="content-tabs">
                        <button className={`content-tab ${activeTab === 'explorer' ? 'active' : ''}`} onClick={() => setActiveTab('explorer')}>
                            <span className="tab-icon">🌍</span> EXPLORE
                        </button>
                        <button className={`content-tab ${activeTab === 'news' ? 'active' : ''}`} onClick={() => setActiveTab('news')}>
                            <span className="tab-icon">📰</span> NEWS
                        </button>
                        <button className={`content-tab ${activeTab === 'spotlight' ? 'active' : ''}`} onClick={() => setActiveTab('spotlight')}>
                            <span className="tab-icon">🚀</span> STARTUPS
                        </button>
                        <button className={`content-tab ${activeTab === 'learn' ? 'active' : ''}`} onClick={() => setActiveTab('learn')}>
                            <span className="tab-icon">🧠</span> LEARN
                        </button>
                    </nav>

                    <div className="content-area fade-in" key={activeTab}>
                        {activeTab === 'explorer' && (
                            <div className="content-pane">
                                <WorldMap
                                    route={explorer.worldRoute}
                                    riderLat={explorer.riderPos.lat}
                                    riderLng={explorer.riderPos.lng}
                                    riderIndex={explorer.riderPos.index}
                                    progress={explorer.riderPos.progress}
                                    elevation={explorer.riderPos.elevation}
                                    speed={cyclingData.speed * explorer.speedMultiplier}
                                    multiplier={explorer.speedMultiplier}
                                />
                            </div>
                        )}
                        {activeTab === 'news' && (
                            <div className="content-pane">
                                <NewsFeed items={newsItems} />
                            </div>
                        )}
                        {activeTab === 'spotlight' && (
                            <div className="content-pane">
                                <NewsFeed items={newsItems.filter(n => n.category === 'startup' || n.category === 'ai')} />
                            </div>
                        )}
                        {activeTab === 'learn' && (
                            <div className="content-pane">
                                <Flashcards cadence={cyclingData.cadence} />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Footer */}
            <footer className="app-footer">
                <div className="app-footer-brand">
                    🚴 <a href="https://piwi.ai" target="_blank" rel="noopener">PIWI Ride</a>
                </div>
                <div className="app-footer-tagline">Train your body and your mind</div>
                <div className="app-footer-links">
                    <a href="https://ride.piwi.ai">ride.piwi.ai</a>
                </div>
            </footer>

            {/* Modals */}
            {showSettings && <Settings settings={settings} onUpdate={setSettings} onClose={() => setShowSettings(false)} />}
            {showHistory && <RideHistory history={rideHistory} onClose={() => setShowHistory(false)} />}
        </div>
    );
};
