/**
 * BLE Service — Wahoo KICKR / FTMS Connection
 *
 * Uses Web Bluetooth API to connect to FTMS-compatible trainers.
 * Falls back to mock data when no Bluetooth hardware is available.
 *
 * FTMS Service UUID: 0x1826
 * Indoor Bike Data Characteristic: 0x2AD2
 * Heart Rate Service UUID: 0x180D
 * Heart Rate Measurement Characteristic: 0x2A37
 */

import { CyclingData, ConnectionStatus } from '../types';

// BLE Service UUIDs
const FTMS_SERVICE = 0x1826;
const INDOOR_BIKE_DATA = 0x2AD2;
const FTMS_CONTROL_POINT = 0x2AD9;
const HEART_RATE_SERVICE = 0x180D;
const HEART_RATE_MEASUREMENT = 0x2A37;

type DataCallback = (data: Partial<CyclingData>) => void;
type StatusCallback = (status: ConnectionStatus) => void;

export class BleService {
    private device: BluetoothDevice | null = null;
    private controlPoint: BluetoothRemoteGATTCharacteristic | null = null;
    private hasControl = false;
    private onDataCallbacks: DataCallback[] = [];
    private onStatusCallbacks: StatusCallback[] = [];
    private _status: ConnectionStatus = 'disconnected';

    get status() { return this._status; }

    private setStatus(status: ConnectionStatus) {
        this._status = status;
        this.onStatusCallbacks.forEach(cb => cb(status));
    }

    onData(callback: DataCallback) {
        this.onDataCallbacks.push(callback);
        return () => {
            this.onDataCallbacks = this.onDataCallbacks.filter(cb => cb !== callback);
        };
    }

    onStatus(callback: StatusCallback) {
        this.onStatusCallbacks.push(callback);
        return () => {
            this.onStatusCallbacks = this.onStatusCallbacks.filter(cb => cb !== callback);
        };
    }

    private emitData(data: Partial<CyclingData>) {
        this.onDataCallbacks.forEach(cb => cb(data));
    }

    /**
     * Check if Web Bluetooth is available in the current browser
     */
    isBluetoothAvailable(): boolean {
        return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
    }

    /**
     * Connect to a BLE FTMS trainer
     */
    async connect(): Promise<void> {
        if (!this.isBluetoothAvailable()) {
            throw new Error('Web Bluetooth is not available. Use Chrome or Edge.');
        }

        this.setStatus('connecting');

        try {
            this.device = await navigator.bluetooth.requestDevice({
                filters: [
                    { services: [FTMS_SERVICE] },
                ],
                optionalServices: [HEART_RATE_SERVICE],
            });

            this.device.addEventListener('gattserverdisconnected', () => {
                this.setStatus('disconnected');
            });

            const server = await this.device.gatt!.connect();
            this.setStatus('connected');

            // Subscribe to Indoor Bike Data
            try {
                const ftmsService = await server.getPrimaryService(FTMS_SERVICE);
                const bikeData = await ftmsService.getCharacteristic(INDOOR_BIKE_DATA);
                await bikeData.startNotifications();
                bikeData.addEventListener('characteristicvaluechanged', (event: Event) => {
                    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
                    if (target.value) {
                        this.parseFTMSData(target.value);
                    }
                });
            } catch (e) {
                console.warn('FTMS Indoor Bike Data not available:', e);
            }

            // Acquire FTMS Control Point for writing resistance/grade
            try {
                const ftmsService = await server.getPrimaryService(FTMS_SERVICE);
                this.controlPoint = await ftmsService.getCharacteristic(FTMS_CONTROL_POINT);
                console.info('✅ FTMS Control Point acquired');
            } catch (e) {
                console.warn('FTMS Control Point not available (resistance control disabled):', e);
                this.controlPoint = null;
            }

            // Subscribe to Heart Rate
            try {
                const hrService = await server.getPrimaryService(HEART_RATE_SERVICE);
                const hrChar = await hrService.getCharacteristic(HEART_RATE_MEASUREMENT);
                await hrChar.startNotifications();
                hrChar.addEventListener('characteristicvaluechanged', (event: Event) => {
                    const target = event.target as unknown as BluetoothRemoteGATTCharacteristic;
                    if (target.value) {
                        this.parseHeartRate(target.value);
                    }
                });
            } catch (e) {
                console.warn('Heart Rate service not available:', e);
            }

        } catch (error) {
            this.setStatus('disconnected');
            throw error;
        }
    }

    disconnect() {
        if (this.device?.gatt?.connected) {
            this.device.gatt.disconnect();
        }
        this.controlPoint = null;
        this.hasControl = false;
        this.setStatus('disconnected');
    }

    /**
     * Request control of the FTMS trainer (Op Code 0x00).
     * Must be called before setSimulation/setResistance.
     */
    async requestControl(): Promise<boolean> {
        if (!this.controlPoint) return false;
        try {
            const buf = new ArrayBuffer(1);
            new DataView(buf).setUint8(0, 0x00); // Request Control
            await this.controlPoint.writeValue(buf);
            this.hasControl = true;
            console.info('✅ FTMS control granted');
            return true;
        } catch (e) {
            console.warn('Failed to request FTMS control:', e);
            return false;
        }
    }

    /**
     * Set Indoor Bike Simulation parameters (Op Code 0x11).
     * This is the realistic mode — the trainer auto-adjusts resistance
     * to simulate the given road grade.
     *
     * @param grade — Road grade in % (-40 to +40)
     * @param windSpeed — Wind speed in m/s (default 0)
     * @param crr — Rolling resistance coefficient (default 0.004)
     * @param cw — Wind resistance coefficient (default 0.51)
     */
    async setSimulation(grade: number, windSpeed = 0, crr = 0.004, cw = 0.51): Promise<void> {
        if (!this.controlPoint) return;
        if (!this.hasControl) await this.requestControl();

        // FTMS spec: Op Code (1) + Wind Speed (2) + Grade (2) + Crr (1) + Cw (1) = 7 bytes
        const buf = new ArrayBuffer(7);
        const dv = new DataView(buf);
        dv.setUint8(0, 0x11); // Set Indoor Bike Simulation Parameters
        dv.setInt16(1, Math.round(windSpeed * 1000), true);      // 0.001 m/s resolution
        dv.setInt16(3, Math.round(grade * 100), true);           // 0.01% resolution
        dv.setUint8(5, Math.round(crr * 10000));                 // 0.0001 resolution
        dv.setUint8(6, Math.round(cw * 100));                    // 0.01 resolution

        try {
            await this.controlPoint.writeValue(buf);
        } catch (e) {
            console.warn('Failed to set FTMS simulation:', e);
        }
    }

    /**
     * Set target resistance level (Op Code 0x04).
     * Simpler fallback if Indoor Bike Simulation is not supported.
     *
     * @param level — Resistance level 0.0 to 100.0
     */
    async setResistance(level: number): Promise<void> {
        if (!this.controlPoint) return;
        if (!this.hasControl) await this.requestControl();

        const buf = new ArrayBuffer(3);
        const dv = new DataView(buf);
        dv.setUint8(0, 0x04); // Set Target Resistance Level
        dv.setInt16(1, Math.round(Math.max(0, Math.min(100, level)) * 10), true); // 0.1 resolution

        try {
            await this.controlPoint.writeValue(buf);
        } catch (e) {
            console.warn('Failed to set FTMS resistance:', e);
        }
    }

    /**
     * Parse FTMS Indoor Bike Data characteristic (0x2AD2)
     * See: https://www.bluetooth.com/specifications/specs/fitness-machine-service-1-0/
     */
    private parseFTMSData(dataView: DataView) {
        const flags = dataView.getUint16(0, true);
        let offset = 2;
        const result: Partial<CyclingData> = {};

        // Instantaneous Speed (always present if bit 0 is 0)
        if (!(flags & 0x01)) {
            result.speed = dataView.getUint16(offset, true) * 0.01; // km/h with 0.01 res
            offset += 2;
        }

        // Average Speed
        if (flags & 0x02) {
            offset += 2; // skip average speed
        }

        // Instantaneous Cadence
        if (flags & 0x04) {
            result.cadence = dataView.getUint16(offset, true) * 0.5; // 0.5 rpm res
            offset += 2;
        }

        // Average Cadence
        if (flags & 0x08) {
            offset += 2;
        }

        // Total Distance
        if (flags & 0x10) {
            result.distance = dataView.getUint16(offset, true) | (dataView.getUint8(offset + 2) << 16);
            offset += 3;
        }

        // Resistance Level
        if (flags & 0x20) {
            offset += 2;
        }

        // Instantaneous Power
        if (flags & 0x40) {
            result.power = dataView.getInt16(offset, true);
            offset += 2;
        }

        // Average Power
        if (flags & 0x80) {
            offset += 2;
        }

        // Expended Energy
        if (flags & 0x100) {
            result.calories = dataView.getUint16(offset, true);
            offset += 2;
            offset += 2; // energy per hour
            offset += 1; // energy per minute
        }

        // Heart Rate
        if (flags & 0x200) {
            result.heartRate = dataView.getUint8(offset);
            offset += 1;
        }

        // Elapsed Time
        if (flags & 0x800) {
            result.elapsedTime = dataView.getUint16(offset, true);
        }

        this.emitData(result);
    }

    /**
     * Parse Heart Rate Measurement characteristic (0x2A37)
     */
    private parseHeartRate(dataView: DataView) {
        const flags = dataView.getUint8(0);
        const is16Bit = flags & 0x01;
        const heartRate = is16Bit
            ? dataView.getUint16(1, true)
            : dataView.getUint8(1);

        this.emitData({ heartRate });
    }
}

// ─── Mock BLE Service ───

export class MockBleService extends BleService {
    private intervalId: ReturnType<typeof setInterval> | null = null;
    private _mockPower = 180;
    private _mockCadence = 85;
    private _mockHR = 140;
    private _mockSpeed = 28;
    private _mockDistance = 0;
    private _mockCalories = 0;
    private _startTime = 0;
    private _mockGrade = 0;

    override isBluetoothAvailable() { return true; }

    /**
     * Mock simulation: adjust power based on grade to simulate effort.
     * +5% grade → ~50W more, -5% grade → ~50W less.
     */
    override async setSimulation(grade: number): Promise<void> {
        this._mockGrade = grade;
        console.log(`[Mock] Simulation grade set to ${grade.toFixed(1)}%`);
    }

    override async setResistance(level: number): Promise<void> {
        this._mockGrade = level / 5; // rough mapping
        console.log(`[Mock] Resistance set to ${level.toFixed(1)}`);
    }

    override async connect(): Promise<void> {
        // Simulate connection delay
        const statusCbs = (this as any).onStatusCallbacks as StatusCallback[];
        statusCbs.forEach(cb => cb('connecting'));

        await new Promise(resolve => setTimeout(resolve, 1500));

        (this as any)._status = 'connected';
        statusCbs.forEach(cb => cb('connected'));

        this._startTime = Date.now();
        this._mockDistance = 0;
        this._mockCalories = 0;

        // Emit realistic-ish cycling data every second
        this.intervalId = setInterval(() => {
            // Add some randomness to simulate a real ride
            // Adjust power based on mock grade (simulate climbing effort)
            const gradeEffect = this._mockGrade * 10; // +10W per 1% grade
            this._mockPower = Math.max(80, Math.min(400,
                this._mockPower + (Math.random() - 0.48) * 20 + gradeEffect * 0.1
            ));
            this._mockCadence = Math.max(60, Math.min(110,
                this._mockCadence + (Math.random() - 0.5) * 4
            ));
            this._mockHR = Math.max(100, Math.min(185,
                this._mockHR + (Math.random() - 0.48) * 3
            ));
            this._mockSpeed = Math.max(15, Math.min(45,
                this._mockSpeed + (Math.random() - 0.5) * 2
            ));

            const elapsed = (Date.now() - this._startTime) / 1000;
            this._mockDistance += this._mockSpeed / 3.6; // m/s for 1 second
            this._mockCalories += this._mockPower * 0.00105; // rough kcal/s

            const dataCbs = (this as any).onDataCallbacks as DataCallback[];
            dataCbs.forEach(cb => cb({
                power: Math.round(this._mockPower),
                cadence: Math.round(this._mockCadence),
                heartRate: Math.round(this._mockHR),
                speed: Math.round(this._mockSpeed * 10) / 10,
                distance: Math.round(this._mockDistance),
                calories: Math.round(this._mockCalories),
                elapsedTime: Math.round(elapsed),
            }));
        }, 1000);
    }

    override disconnect() {
        if (this.intervalId) clearInterval(this.intervalId);
        this.intervalId = null;
        const statusCbs = (this as any).onStatusCallbacks as StatusCallback[];
        (this as any)._status = 'disconnected';
        statusCbs.forEach(cb => cb('disconnected'));
    }
}

/**
 * Factory: always uses mock in development for auto-connect.
 * When deployed with real hardware, set useMock = false.
 */
export function createBleService(useMock = true): BleService {
    if (!useMock) {
        const real = new BleService();
        if (real.isBluetoothAvailable()) {
            return real;
        }
    }
    console.info('🔌 Using mock trainer data');
    return new MockBleService();
}
