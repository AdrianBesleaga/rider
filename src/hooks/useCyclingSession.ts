import { useState, useRef, useCallback, useEffect } from 'react';
import { CyclingData, ConnectionStatus, PowerSample, NewsItem } from '../types';
import { createBleService, BleService } from '../services/bleService';
import { saveRide, RideRecord } from '../services/rideHistory';
import { downloadTcx } from '../services/stravaExport';
import { stopVoiceBriefing } from '../services/voiceBriefing';

const INITIAL_CYCLING_DATA: CyclingData = {
    power: 0, cadence: 0, speed: 0, heartRate: 0,
    distance: 0, calories: 0, elapsedTime: 0,
};

/**
 * Manages BLE connection, cycling data, power samples, and ride lifecycle.
 */
export function useCyclingSession() {
    const bleRef = useRef<BleService | null>(null);
    const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
    const [cyclingData, setCyclingData] = useState<CyclingData>(INITIAL_CYCLING_DATA);
    const [powerSamples, setPowerSamples] = useState<PowerSample[]>([]);
    const [newsConsumed, setNewsConsumed] = useState<NewsItem[]>([]);
    const rideStartRef = useRef<Date>(new Date());

    // Collect power samples
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

    const startRide = useCallback((mock: boolean) => {
        const ble = createBleService(mock);
        bleRef.current = ble;

        ble.onData((partial) => {
            setCyclingData(prev => ({ ...prev, ...partial }));
        });
        ble.onStatus(setConnectionStatus);

        rideStartRef.current = new Date();
        ble.connect().catch(console.error);
    }, []);

    const connect = useCallback(async () => {
        if (!bleRef.current) return;
        try { await bleRef.current.connect(); } catch (err) { console.error('Connection failed:', err); }
    }, []);

    const disconnect = useCallback(() => {
        bleRef.current?.disconnect();
        setCyclingData(INITIAL_CYCLING_DATA);
        setPowerSamples([]);
    }, []);

    const endRide = useCallback(() => {
        bleRef.current?.disconnect();
        stopVoiceBriefing();
        const record = saveRide(cyclingData, newsConsumed);
        return record;
    }, [cyclingData, newsConsumed]);

    const exportStrava = useCallback(() => {
        downloadTcx({
            cyclingData,
            powerSamples,
            startTime: rideStartRef.current,
        });
    }, [cyclingData, powerSamples]);

    const resetSession = useCallback(() => {
        setCyclingData(INITIAL_CYCLING_DATA);
        setPowerSamples([]);
        setNewsConsumed([]);
    }, []);

    return {
        bleRef,
        connectionStatus,
        cyclingData,
        powerSamples,
        newsConsumed,
        setNewsConsumed,
        startRide,
        connect,
        disconnect,
        endRide,
        exportStrava,
        resetSession,
    };
}

export { INITIAL_CYCLING_DATA };
