import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CyclingData, ConnectionStatus, PowerSample, ContentTab } from './types';
import { createBleService, BleService } from './services/bleService';
import { getCryptoTickers, getStockQuotes, getNewsItems } from './services/mockData';
import { CryptoTickerBar } from './components/CryptoTicker';
import { CyclingMetrics } from './components/CyclingMetrics';
import { PowerGraph } from './components/PowerGraph';
import { StockChart } from './components/StockChart';
import { NewsFeed } from './components/NewsFeed';
import { RiderScene } from './components/RiderScene';
import { HUD } from './components/HUD';

type AppView = 'dashboard' | 'rider3d';

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
    const [view, setView] = useState<AppView>('rider3d');

    // ─── BLE / Cycling state ───
    const bleRef = useRef<BleService | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [cyclingData, setCyclingData] = useState<CyclingData>(INITIAL_CYCLING_DATA);
    const [powerSamples, setPowerSamples] = useState<PowerSample[]>([]);

    // ─── Data feed state ───
    const [cryptoTickers, setCryptoTickers] = useState(getCryptoTickers());
    const [stockQuotes, setStockQuotes] = useState(getStockQuotes());
    const [newsItems] = useState(getNewsItems());
    const [selectedStock, setSelectedStock] = useState('NVDA');
    const [activeTab, setActiveTab] = useState<ContentTab>('charts');

    // ─── Initialize BLE — auto-connect mock ───
    useEffect(() => {
        const ble = createBleService();
        bleRef.current = ble;

        const unsubData = ble.onData((partial) => {
            setCyclingData(prev => ({ ...prev, ...partial }));
        });

        const unsubStatus = ble.onStatus(setConnectionStatus);

        // Auto-connect so 3D scene has data immediately
        ble.connect().catch(console.error);

        return () => {
            unsubData();
            unsubStatus();
            ble.disconnect();
        };
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

    // ─── Update crypto/stock tickers periodically ───
    useEffect(() => {
        const interval = setInterval(() => {
            setCryptoTickers(getCryptoTickers());
            setStockQuotes(getStockQuotes());
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // ─── Handlers ───
    const handleConnect = useCallback(async () => {
        if (!bleRef.current) return;
        try {
            await bleRef.current.connect();
        } catch (err) {
            console.error('Connection failed:', err);
        }
    }, []);

    const handleDisconnect = useCallback(() => {
        bleRef.current?.disconnect();
        setCyclingData(INITIAL_CYCLING_DATA);
        setPowerSamples([]);
    }, []);

    // ─── 3D Rider View ───
    if (view === 'rider3d') {
        return (
            <div className="app" style={{ position: 'relative' }}>
                <RiderScene
                    cyclingData={cyclingData}
                    cryptoTickers={cryptoTickers}
                    stockQuotes={stockQuotes}
                    newsItems={newsItems}
                />
                <HUD
                    data={cyclingData}
                    status={connectionStatus}
                    onConnect={handleConnect}
                    onSwitchView={() => setView('dashboard')}
                />
            </div>
        );
    }

    // ─── Dashboard View ───
    return (
        <div className="app">
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
                <button
                    className="view-toggle-btn"
                    onClick={() => setView('rider3d')}
                    title="Switch to 3D Rider View"
                >
                    🌐 3D Ride
                </button>
            </header>

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
                    </div>
                </main>
            </div>
        </div>
    );
};
