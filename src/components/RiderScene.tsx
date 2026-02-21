import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CyclingData, CryptoTicker as CryptoTickerType, StockQuote, NewsItem, RideStyle } from '../types';
import { CyberEnvironment } from './3d/Environment';
import { Road } from './3d/Road';
import { Cyclist } from './3d/Cyclist';
import { CityProps } from './3d/CityProps';
import {
    BillboardFrame,
    createCryptoTexture,
    createStockTexture,
    createNewsTexture,
    createStartupTexture,
    createSummaryTexture,
} from './3d/DataBillboard';
import { getStartups } from '../services/mockData';

/**
 * RiderScene — main 3D canvas
 *
 * Performance optimizations:
 * 1. NO post-processing (Bloom/Vignette removed — biggest GPU saver)
 * 2. NO Html billboards (CanvasTexture instead — no DOM overhead)
 * 3. Adaptive DPR capped at 1.5
 * 4. Reduced point lights (lights are expensive)
 * 5. Shared geometries/materials via useMemo
 */

function CameraControls() {
    return (
        <OrbitControls
            target={[0, 0.5, -2]}
            enableDamping
            dampingFactor={0.1}
            minDistance={1.5}
            maxDistance={12}
            minPolarAngle={0.2}
            maxPolarAngle={Math.PI / 2 - 0.05}
        />
    );
}

/** A single data zone: main panel + summary phrases spread over 1km */
interface DataZone {
    mainTexture: THREE.CanvasTexture;
    mainWidth: number;
    mainHeight: number;
    glowColor: string;
    summaryLines: string[];
    summaryColor: string;
    z: number;
}

const PHRASE_SPACING = 50;  // 50m between each summary phrase (camera sees ~60m ahead)
const ZONE_BUFFER = 40;     // buffer after last phrase before next zone

function DataZones({ cryptoTickers, stockQuotes, newsItems, speed }: {
    cryptoTickers: CryptoTickerType[];
    stockQuotes: StockQuote[];
    newsItems: NewsItem[];
    speed: number;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const startups = useMemo(() => getStartups(), []);

    // Build zones: each data item gets 1km
    const zones = useMemo((): DataZone[] => {
        const items: DataZone[] = [];
        // Helper: push a zone and advance offset dynamically
        let zOffset = -50;
        function addZone(zone: Omit<DataZone, 'z'>) {
            items.push({ ...zone, z: zOffset });
            zOffset -= (zone.summaryLines.length + 1) * PHRASE_SPACING + ZONE_BUFFER;
        }

        // Zone 1: Crypto #1
        const c1 = cryptoTickers[0];
        const c1Up = c1.change24h >= 0;
        const c1Price = c1.price >= 1 ? '$' + c1.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '$' + c1.price.toFixed(4);
        addZone({
            mainTexture: createCryptoTexture(c1),
            mainWidth: 5, mainHeight: 3.2,
            glowColor: c1Up ? '#00e676' : '#ff5252',
            summaryLines: [
                `${c1.name} (${c1.symbol})`,
                `Trading at ${c1Price}`,
                `${c1Up ? 'Up' : 'Down'} ${c1Up ? '+' : ''}${c1.change24h.toFixed(2)}% in 24h`,
                c1Up ? '📈 Trend: Bullish momentum' : '📉 Trend: Bearish pressure',
            ],
            summaryColor: c1Up ? '#00e676' : '#ff5252',
        });

        // Zone 2: Stock #1
        const s1 = stockQuotes[0];
        const s1Up = s1.change >= 0;
        addZone({
            mainTexture: createStockTexture(s1),
            mainWidth: 5, mainHeight: 3.2,
            glowColor: s1Up ? '#00e676' : '#ff5252',
            summaryLines: [
                `${s1.name} (${s1.symbol})`,
                `Share price: $${s1.price.toFixed(2)}`,
                `${s1Up ? 'Gains' : 'Drops'} ${s1Up ? '+' : ''}${s1.change.toFixed(2)} (${s1.changePercent.toFixed(2)}%)`,
                `Volume: ${(s1.volume / 1e6).toFixed(1)}M shares`,
            ],
            summaryColor: s1Up ? '#00e676' : '#ff5252',
        });

        // Zone 3: Startup #1
        const st1 = startups[0];
        addZone({
            mainTexture: createStartupTexture(st1),
            mainWidth: 6, mainHeight: 3.5,
            glowColor: '#c084fc',
            summaryLines: [
                `🚀 ${st1.name} — ${st1.category}`,
                st1.tagline,
                `Funding: ${st1.funding}`,
                `Competitors: ${st1.competitors.join(', ')}`,
            ],
            summaryColor: '#c084fc',
        });

        // Zone 4: News #1
        const n1 = newsItems[0];
        addZone({
            mainTexture: createNewsTexture(n1),
            mainWidth: 5, mainHeight: 3.2,
            glowColor: '#818cf8',
            summaryLines: [
                n1.title.length > 40 ? n1.title.substring(0, 40) + '...' : n1.title,
                n1.summary.substring(0, 50) + '...',
                `Source: ${n1.source} · ${n1.publishedAt}`,
            ],
            summaryColor: '#818cf8',
        });

        // Zone 5: Crypto #2
        const c2 = cryptoTickers[1 % cryptoTickers.length];
        const c2Up = c2.change24h >= 0;
        const c2Price = c2.price >= 1 ? '$' + c2.price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '$' + c2.price.toFixed(4);
        addZone({
            mainTexture: createCryptoTexture(c2),
            mainWidth: 5, mainHeight: 3.2,
            glowColor: c2Up ? '#00e676' : '#ff5252',
            summaryLines: [
                `${c2.name} (${c2.symbol})`,
                `Trading at ${c2Price}`,
                `${c2Up ? 'Up' : 'Down'} ${c2Up ? '+' : ''}${c2.change24h.toFixed(2)}% in 24h`,
                c2Up ? '📈 Trend: Bullish momentum' : '📉 Trend: Bearish pressure',
            ],
            summaryColor: c2Up ? '#00e676' : '#ff5252',
        });

        // Zone 6: Startup #2
        const st2 = startups[1 % startups.length];
        addZone({
            mainTexture: createStartupTexture(st2),
            mainWidth: 6, mainHeight: 3.5,
            glowColor: '#06d6c4',
            summaryLines: [
                `🚀 ${st2.name} — ${st2.category}`,
                st2.tagline,
                `Funding: ${st2.funding}`,
                `Competitors: ${st2.competitors.join(', ')}`,
            ],
            summaryColor: '#06d6c4',
        });

        // Zone 7: Stock #2
        const s2 = stockQuotes[1 % stockQuotes.length];
        const s2Up = s2.change >= 0;
        addZone({
            mainTexture: createStockTexture(s2),
            mainWidth: 5, mainHeight: 3.2,
            glowColor: s2Up ? '#00e676' : '#ff5252',
            summaryLines: [
                `${s2.name} (${s2.symbol})`,
                `Share price: $${s2.price.toFixed(2)}`,
                `${s2Up ? 'Gains' : 'Drops'} ${s2Up ? '+' : ''}${s2.change.toFixed(2)} (${s2.changePercent.toFixed(2)}%)`,
                `Volume: ${(s2.volume / 1e6).toFixed(1)}M shares`,
            ],
            summaryColor: s2Up ? '#00e676' : '#ff5252',
        });

        // Zone 8: News #2
        const n2 = newsItems[1 % newsItems.length];
        addZone({
            mainTexture: createNewsTexture(n2),
            mainWidth: 5, mainHeight: 3.2,
            glowColor: '#f59e0b',
            summaryLines: [
                n2.title.length > 40 ? n2.title.substring(0, 40) + '...' : n2.title,
                n2.summary.substring(0, 50) + '...',
                `Source: ${n2.source} · ${n2.publishedAt}`,
            ],
            summaryColor: '#f59e0b',
        });

        return items;
    }, [cryptoTickers, stockQuotes, newsItems, startups]);

    // Compute total span from actual zone sizes
    const totalSpan = useMemo(() => {
        return zones.reduce((sum, z) => sum + (z.summaryLines.length + 1) * PHRASE_SPACING + ZONE_BUFFER, 0);
    }, [zones]);

    // Build summary textures
    const summaryTextures = useMemo(() =>
        zones.map(z => z.summaryLines.map(line => createSummaryTexture([line], z.summaryColor))),
        [zones]);

    const activeZoneRef = useRef(0);
    const scrollDistRef = useRef(0);

    // Precompute cumulative zone boundaries
    const zoneBoundaries = useMemo(() => {
        let cum = 0;
        return zones.map(z => {
            const start = cum;
            cum += (z.summaryLines.length + 1) * PHRASE_SPACING + ZONE_BUFFER;
            return { start, end: cum };
        });
    }, [zones]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const moveSpeed = (Math.max(speed, 8) / 3.6) * delta;
        scrollDistRef.current += moveSpeed;

        // Wrap scroll distance
        if (scrollDistRef.current > totalSpan) {
            scrollDistRef.current -= totalSpan;
        }

        // Determine active zone
        for (let i = 0; i < zoneBoundaries.length; i++) {
            if (scrollDistRef.current >= zoneBoundaries[i].start && scrollDistRef.current < zoneBoundaries[i].end) {
                activeZoneRef.current = i;
                break;
            }
        }

        groupRef.current.children.forEach((child) => {
            child.position.z += moveSpeed;
            if (child.position.z > 50) {
                child.position.z -= totalSpan + 50;
            }
        });
    });

    const activeZone = zones[activeZoneRef.current] || zones[0];

    return (
        <>
            {/* FIXED billboard — left side of road, parallel with street */}
            <BillboardFrame
                position={[-5, 2.5, -4]}
                rotation={[0, Math.PI / 2, 0]}
                width={activeZone.mainWidth}
                height={activeZone.mainHeight}
                glowColor={activeZone.glowColor}
                texture={activeZone.mainTexture}
            />
            <mesh position={[-5, 2.5, -4]} rotation={[0, Math.PI / 2, 0]}>
                <planeGeometry args={[activeZone.mainWidth + 2, activeZone.mainHeight + 1.5]} />
                <meshBasicMaterial color={activeZone.glowColor} transparent opacity={0.05} depthWrite={false} />
            </mesh>

            {/* Scrolling summary phrases only */}
            <group ref={groupRef}>
                {zones.map((zone, zi) => (
                    <group key={zi} position={[0, 0, zone.z]}>
                        {zone.summaryLines.map((_, si) => {
                            const lane = si % 3 === 0 ? -2.2 : si % 3 === 1 ? 0 : 2.2;
                            const tex = summaryTextures[zi][si];
                            const cw = (tex.image as HTMLCanvasElement).width / 80;
                            const ch = (tex.image as HTMLCanvasElement).height / 80;
                            return (
                                <group key={si} position={[lane, 1.2, (si + 1) * PHRASE_SPACING]}>
                                    <mesh>
                                        <planeGeometry args={[cw, ch]} />
                                        <meshBasicMaterial map={tex} transparent depthWrite={false} side={THREE.DoubleSide} />
                                    </mesh>
                                </group>
                            );
                        })}
                    </group>
                ))}
            </group>
        </>
    );
}

interface SceneContentProps {
    cyclingData: CyclingData;
    cryptoTickers: CryptoTickerType[];
    stockQuotes: StockQuote[];
    newsItems: NewsItem[];
    rideStyle: RideStyle;
}

function SceneContent({ cyclingData, cryptoTickers, stockQuotes, newsItems, rideStyle }: SceneContentProps) {
    const effectiveSpeed = Math.max(cyclingData.speed, 12);

    return (
        <>
            <CameraControls />
            <CyberEnvironment speed={effectiveSpeed} />
            <Road speed={effectiveSpeed} rideStyle={rideStyle} />

            {/* Bike centered on road */}
            <Cyclist cadence={Math.max(cyclingData.cadence, 0)} />

            <CityProps speed={effectiveSpeed} />
            <DataZones
                cryptoTickers={cryptoTickers}
                stockQuotes={stockQuotes}
                newsItems={newsItems}
                speed={effectiveSpeed}
            />

            {/* NO post-processing — saves massive GPU overhead */}
        </>
    );
}

interface RiderSceneProps {
    cyclingData: CyclingData;
    cryptoTickers: CryptoTickerType[];
    stockQuotes: StockQuote[];
    newsItems: NewsItem[];
    rideStyle: RideStyle;
}

export const RiderScene: React.FC<RiderSceneProps> = ({
    cyclingData,
    cryptoTickers,
    stockQuotes,
    newsItems,
    rideStyle,
}) => {
    return (
        <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <Canvas
                camera={{ fov: 70, near: 0.1, far: 300, position: [1.5, 2.0, 4.0] }}
                gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
                dpr={[1, 1.5]}
                performance={{ min: 0.5 }}
            >
                <SceneContent
                    cyclingData={cyclingData}
                    cryptoTickers={cryptoTickers}
                    stockQuotes={stockQuotes}
                    newsItems={newsItems}
                    rideStyle={rideStyle}
                />
            </Canvas>
        </div>
    );
};
