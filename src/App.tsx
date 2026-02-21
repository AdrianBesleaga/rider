import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CyclingData, ConnectionStatus, PowerSample, ContentTab, NewsItem } from './types';
import { createBleService, BleService } from './services/bleService';
import { fetchCryptoTickers, fetchNewsItems } from './services/dataService';
import { getCryptoTickers as getMockCrypto, getStockQuotes, getNewsItems as getMockNews } from './services/mockData';
import { API } from './services/apiConfig';
import { saveRide, getRideHistory, RideRecord } from './services/rideHistory';
import { downloadTcx } from './services/stravaExport';
import { startVoiceBriefing, stopVoiceBriefing } from './services/voiceBriefing';
import { CryptoTickerBar } from './components/CryptoTicker';
import { CyclingMetrics } from './components/CyclingMetrics';
import { PowerGraph } from './components/PowerGraph';
import { StockChart } from './components/StockChart';
import { NewsFeed } from './components/NewsFeed';
import { RiderScene } from './components/RiderScene';
import { HUD } from './components/HUD';
import { LandingPage } from './components/LandingPage';
import { SessionSummary } from './components/SessionSummary';
import { PodcastPlayer } from './components/PodcastPlayer';
import { Flashcards } from './components/Flashcards';
import { HRZones } from './components/HRZones';
import { FounderDashboard } from './components/FounderDashboard';
import { Settings, AppSettings, DEFAULT_SETTINGS } from './components/Settings';
import { RideHistory } from './components/RideHistory';
import { MotivationalBanner } from './components/MotivationalBanner';

type AppView = 'landing' | 'dashboard' | 'rider3d' | 'summary';

const INITIAL_CYCLING_DATA: CyclingData = {
    power: 0,
    cadence: 0,
    speed: 0,
    heartRate: 0,
    distance: 0,
    calories: 0,
    elapsedTime: 0,
};

export const App: React.FC = () => {
    // ─── View state ───
    const [view, setView] = useState<AppView>('landing');

    // ─── BLE / Cycling state ───
    const bleRef = useRef<BleService | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [cyclingData, setCyclingData] = useState<CyclingData>(INITIAL_CYCLING_DATA);
    const [powerSamples, setPowerSamples] = useState<PowerSample[]>([]);
    const rideStartRef = useRef<Date>(new Date());

    // ─── Data feed state ───
    const [cryptoTickers, setCryptoTickers] = useState(getMockCrypto());
    const [stockQuotes, setStockQuotes] = useState(getStockQuotes());
    const [newsItems, setNewsItems] = useState<NewsItem[]>(getMockNews());
    const [selectedStock, setSelectedStock] = useState('NVDA');
    const [activeTab, setActiveTab] = useState<ContentTab>('charts');

    // ─── Track news consumed during ride ───
    const [newsConsumed, setNewsConsumed] = useState<NewsItem[]>([]);

    // ─── Settings & modals ───
    const [settings, setSettings] = useState<AppSettings>(() => {
        try {
            const saved = localStorage.getItem('stockrider_settings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
        } catch { return DEFAULT_SETTINGS; }
    });
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    const [rideHistory, setRideHistory] = useState<RideRecord[]>(getRideHistory());

    // Persist settings
    useEffect(() => {
        try { localStorage.setItem('stockrider_settings', JSON.stringify(settings)); } catch { /* noop */ }
    }, [settings]);

    // ─── Fetch real data when not using mock ───
    useEffect(() => {
        if (settings.useMockData) return;

        fetchCryptoTickers().then(setCryptoTickers).catch(console.error);
        fetchNewsItems().then((items) => {
            setNewsItems(items);
            setNewsConsumed(items);
        }).catch(console.error);

        const cryptoInterval = setInterval(() => {
            fetchCryptoTickers().then(setCryptoTickers).catch(console.error);
        }, API.crypto.interval);

        const newsInterval = setInterval(() => {
            fetchNewsItems().then((items) => {
                setNewsItems(items);
                setNewsConsumed(prev => {
                    const existing = new Set(prev.map(n => n.id));
                    const newOnes = items.filter(n => !existing.has(n.id));
                    return [...prev, ...newOnes];
                });
            }).catch(console.error);
        }, API.news.interval);

        return () => {
            clearInterval(cryptoInterval);
            clearInterval(newsInterval);
        };
    }, [settings.useMockData]);

    // ─── Mock data fallback ───
    useEffect(() => {
        if (!settings.useMockData) return;
        setNewsConsumed(getMockNews());
        const interval = setInterval(() => {
            setCryptoTickers(getMockCrypto());
            setStockQuotes(getStockQuotes());
        }, 3000);
        return () => clearInterval(interval);
    }, [settings.useMockData]);

    // ─── Voice briefing ───
    useEffect(() => {
        if (settings.voiceBriefing && newsItems.length > 0 && (view === 'rider3d' || view === 'dashboard')) {
            startVoiceBriefing(newsItems);
        }
        return () => stopVoiceBriefing();
    }, [settings.voiceBriefing, view]);

    // ─── Start ride ───
    const startRide = useCallback((mock: boolean) => {
        const ble = createBleService(mock);
        bleRef.current = ble;

        ble.onData((partial) => {
            setCyclingData(prev => ({ ...prev, ...partial }));
        });
        ble.onStatus(setConnectionStatus);

        rideStartRef.current = new Date();
        ble.connect().catch(console.error);
        setView('rider3d');
    }, []);

    // ─── Collect power samples ───
    useEffect(() => {
        if (cyclingData.power > 0) {
            setPowerSamples(prev => {
                const sample: PowerSample = {
                    time: cyclingData.elapsedTime,
                    power: cyclingData.power,
                };
                const next = [...prev, sample];
                return next.length > 600 ? next.slice(-600) : next;
            });
        }
    }, [cyclingData.power, cyclingData.elapsedTime]);

    // ─── Handlers ───
    const handleConnect = useCallback(async () => {
        if (!bleRef.current) return;
        try { await bleRef.current.connect(); } catch (err) { console.error('Connection failed:', err); }
    }, []);

    const handleDisconnect = useCallback(() => {
        bleRef.current?.disconnect();
        setCyclingData(INITIAL_CYCLING_DATA);
        setPowerSamples([]);
    }, []);

    const handleEndRide = useCallback(() => {
        bleRef.current?.disconnect();
        stopVoiceBriefing();
        // Save to history
        const record = saveRide(cyclingData, newsConsumed);
        setRideHistory(prev => [record, ...prev]);
        setView('summary');
    }, [cyclingData, newsConsumed]);

    const handleExportStrava = useCallback(() => {
        downloadTcx({
            cyclingData,
            powerSamples,
            startTime: rideStartRef.current,
        });
    }, [cyclingData, powerSamples]);

    const handleNewRide = useCallback(() => {
        setCyclingData(INITIAL_CYCLING_DATA);
        setPowerSamples([]);
        setNewsConsumed([]);
        startRide(settings.useMockBle);
    }, [startRide, settings.useMockBle]);

    // OBS overlay class
    const obsClass = settings.obsOverlay ? ' obs-overlay' : '';

    // ─── Landing Page ───
    if (view === 'landing') {
        return (
            <>
                <LandingPage
                    onStartRide={() => startRide(false)}
                    onStartDemo={() => {
                        setSettings(s => ({ ...s, useMockData: true, useMockBle: true }));
                        startRide(true);
                    }}
                />
            </>
        );
    }

    // ─── Session Summary ───
    if (view === 'summary') {
        return (
            <>
                <SessionSummary
                    data={cyclingData}
                    newsConsumed={newsConsumed}
                    onNewRide={handleNewRide}
                    onGoHome={() => {
                        setCyclingData(INITIAL_CYCLING_DATA);
                        setPowerSamples([]);
                        setNewsConsumed([]);
                        setView('landing');
                    }}
                    onExportStrava={handleExportStrava}
                />
            </>
        );
    }

    // ─── 3D Rider View ───
    if (view === 'rider3d') {
        return (
            <div className={`app${obsClass}`} style={{ position: 'relative' }}>
                <RiderScene
                    cyclingData={cyclingData}
                    cryptoTickers={cryptoTickers}
                    stockQuotes={stockQuotes}
                    newsItems={newsItems}
                    rideStyle={settings.rideStyle}
                />
                <HUD
                    data={cyclingData}
                    status={connectionStatus}
                    onConnect={handleConnect}
                    onSwitchView={() => setView('dashboard')}
                    onEndRide={handleEndRide}
                />
                {/* Compact podcast player in HUD */}
                <div className="hud-podcast-slot">
                    <PodcastPlayer compact />
                </div>
                <MotivationalBanner rideStyle={settings.rideStyle} />
                {showSettings && <Settings settings={settings} onUpdate={setSettings} onClose={() => setShowSettings(false)} />}
                {showHistory && <RideHistory history={rideHistory} onClose={() => setShowHistory(false)} />}
            </div>
        );
    }

    // ─── Dashboard View ───
    return (
        <div className={`app${obsClass}`}>
            {/* Top Bar */}
            <header className="top-bar">
                <div className="brand">
                    <span className="brand-icon">🚴</span>
                    <span className="brand-name">STOCK RIDER</span>
                    <span className="brand-tag">BETA</span>
                </div>
                <div className="ticker-wrapper">
                    <CryptoTickerBar tickers={cryptoTickers} />
                </div>
                <div className="top-bar-actions">
                    <button className="view-toggle-btn" onClick={() => setView('rider3d')} title="3D ride">
                        🌐 3D
                    </button>
                    <button className="view-toggle-btn" onClick={() => setShowHistory(true)} title="Ride history">
                        📊
                    </button>
                    <button className="view-toggle-btn" onClick={() => setShowSettings(true)} title="Settings">
                        ⚙️
                    </button>
                    <button
                        className="view-toggle-btn end-ride-btn"
                        onClick={handleEndRide}
                        title="End ride"
                    >
                        🏁 End
                    </button>
                </div>
            </header>
            <MotivationalBanner rideStyle={settings.rideStyle} />

            {/* Main Content */}
            <div className="main-content">
                {/* Left Panel — Cycling Metrics */}
                <aside className="left-panel">
                    <div className="left-panel-top">
                        <CyclingMetrics
                            data={cyclingData}
                            status={connectionStatus}
                            onConnect={handleConnect}
                            onDisconnect={handleDisconnect}
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
                        <button
                            className={`content-tab ${activeTab === 'charts' ? 'active' : ''}`}
                            onClick={() => setActiveTab('charts')}
                        >
                            <span className="tab-icon">📈</span> MARKETS
                        </button>
                        <button
                            className={`content-tab ${activeTab === 'news' ? 'active' : ''}`}
                            onClick={() => setActiveTab('news')}
                        >
                            <span className="tab-icon">📰</span> NEWS
                        </button>
                        <button
                            className={`content-tab ${activeTab === 'spotlight' ? 'active' : ''}`}
                            onClick={() => setActiveTab('spotlight')}
                        >
                            <span className="tab-icon">🚀</span> STARTUPS
                        </button>
                        <button
                            className={`content-tab ${activeTab === 'learn' ? 'active' : ''}`}
                            onClick={() => setActiveTab('learn')}
                        >
                            <span className="tab-icon">🧠</span> LEARN
                        </button>
                        <button
                            className={`content-tab ${activeTab === 'audio' ? 'active' : ''}`}
                            onClick={() => setActiveTab('audio')}
                        >
                            <span className="tab-icon">🎧</span> AUDIO
                        </button>
                    </nav>

                    <div className="content-area fade-in" key={activeTab}>
                        {activeTab === 'charts' && (
                            <div className="content-pane">
                                <StockChart
                                    stocks={stockQuotes}
                                    selectedSymbol={selectedStock}
                                    onSelect={setSelectedStock}
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
                        {activeTab === 'audio' && (
                            <div className="content-pane" style={{ padding: 16 }}>
                                <PodcastPlayer />
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Modals */}
            {showSettings && <Settings settings={settings} onUpdate={setSettings} onClose={() => setShowSettings(false)} />}
            {showHistory && <RideHistory history={rideHistory} onClose={() => setShowHistory(false)} />}
        </div>
    );
};
