import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppProvider';
import { MapView } from '../components/MapView';
import { MotivationalBanner } from '../components/MotivationalBanner';
import { AILoadingOverlay } from '../components/AILoadingOverlay';
import { Settings } from '../components/Settings';
import { RideHistory } from '../components/RideHistory';

export const RidePage: React.FC = () => {
    const navigate = useNavigate();
    const {
        explorer, cyclingData, settings, setSettings, aiServiceRef, aiProgress,
        showSettings, setShowSettings, showHistory, setShowHistory,
        rideHistory, handleEndRide, session, obsClass,
    } = useAppContext();

    // Auto-start mock session if BLE not initialized (e.g. direct nav / refresh)
    useEffect(() => {
        if (!session.bleRef.current) {
            session.startRide(settings.useMockBle);
        }
    }, []);

    return (
        <div className={`app${obsClass}`} style={{ position: 'relative', width: '100vw', height: '100vh' }}>
            {/* Top Bar */}
            <header className="top-bar" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1100 }}>
                <div className="brand" onClick={() => { session.resetSession(); navigate('/'); }} style={{ cursor: 'pointer' }} title="Back to home">
                    <span className="brand-icon">🚴</span>
                    <span className="brand-name">RIDE</span>
                    <span className="brand-tag">BETA</span>
                </div>
                <div className="top-bar-actions">
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

            {/* Map */}
            <MapView
                worldRoute={explorer.worldRoute}
                riderPos={explorer.riderPos}
                cyclingData={cyclingData}
                grade={explorer.currentGrade}
                virtualGear={explorer.virtualGear}
                speedMultiplier={explorer.speedMultiplier}
                facts={explorer.facts}
                factIndex={explorer.currentFactIndex}
                isAIFacts={explorer.isAIFacts}
                onSetSpeed={explorer.setSpeedMultiplier}
                onShiftUp={explorer.shiftUp}
                onShiftDown={explorer.shiftDown}
                onBack={() => navigate('/')}
            />

            {/* AI Banner */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 1100, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <MotivationalBanner
                        rideStyle={settings.rideStyle}
                        cyclingData={cyclingData}
                        aiService={aiServiceRef.current}
                    />
                </div>
            </div>
            <div style={{ position: 'absolute', inset: 0, zIndex: 1200, pointerEvents: 'none' }}>
                <div style={{ pointerEvents: 'auto' }}>
                    <AILoadingOverlay progress={aiProgress} />
                </div>
            </div>

            {/* Modals */}
            {showSettings && <Settings settings={settings} onUpdate={setSettings} onClose={() => setShowSettings(false)} />}
            {showHistory && <RideHistory history={rideHistory} onClose={() => setShowHistory(false)} />}
        </div>
    );
};
