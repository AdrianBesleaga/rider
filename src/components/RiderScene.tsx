import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CyclingData, NewsItem, RideStyle } from '../types';
import { CyberEnvironment } from './3d/Environment';
import { Road } from './3d/Road';
import { Cyclist } from './3d/Cyclist';
import { CityProps } from './3d/CityProps';
import {
    BillboardFrame,
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

function DataZones({ newsItems, speed }: {
    newsItems: NewsItem[];
    speed: number;
}) {
    const groupRef = useRef<THREE.Group>(null);
    const startups = useMemo(() => getStartups(), []);

    // Build zones: alternating news and startups
    const zones = useMemo((): DataZone[] => {
        const items: DataZone[] = [];
        let zOffset = -50;
        function addZone(zone: Omit<DataZone, 'z'>) {
            items.push({ ...zone, z: zOffset });
            zOffset -= (zone.summaryLines.length + 1) * PHRASE_SPACING + ZONE_BUFFER;
        }

        // Zone 1: News #1
        if (newsItems.length > 0) {
            const n1 = newsItems[0];
            addZone({
                mainTexture: createNewsTexture(n1),
                mainWidth: 5, mainHeight: 3.2,
                glowColor: '#f59e0b',
                summaryLines: [
                    n1.title.length > 40 ? n1.title.substring(0, 40) + '...' : n1.title,
                    n1.summary.substring(0, 50) + '...',
                    `Source: ${n1.source} · ${n1.publishedAt}`,
                ],
                summaryColor: '#f59e0b',
            });
        }

        // Zone 2: Startup #1
        if (startups.length > 0) {
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
        }

        // Zone 3: News #2
        if (newsItems.length > 1) {
            const n2 = newsItems[1];
            addZone({
                mainTexture: createNewsTexture(n2),
                mainWidth: 5, mainHeight: 3.2,
                glowColor: '#818cf8',
                summaryLines: [
                    n2.title.length > 40 ? n2.title.substring(0, 40) + '...' : n2.title,
                    n2.summary.substring(0, 50) + '...',
                    `Source: ${n2.source} · ${n2.publishedAt}`,
                ],
                summaryColor: '#818cf8',
            });
        }

        // Zone 4: Startup #2
        if (startups.length > 1) {
            const st2 = startups[1];
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
        }

        // Zone 5: News #3
        if (newsItems.length > 2) {
            const n3 = newsItems[2];
            addZone({
                mainTexture: createNewsTexture(n3),
                mainWidth: 5, mainHeight: 3.2,
                glowColor: '#f59e0b',
                summaryLines: [
                    n3.title.length > 40 ? n3.title.substring(0, 40) + '...' : n3.title,
                    n3.summary.substring(0, 50) + '...',
                    `Source: ${n3.source} · ${n3.publishedAt}`,
                ],
                summaryColor: '#f59e0b',
            });
        }

        // Zone 6: Startup #3
        if (startups.length > 2) {
            const st3 = startups[2];
            addZone({
                mainTexture: createStartupTexture(st3),
                mainWidth: 6, mainHeight: 3.5,
                glowColor: '#c084fc',
                summaryLines: [
                    `🚀 ${st3.name} — ${st3.category}`,
                    st3.tagline,
                    `Funding: ${st3.funding}`,
                    `Competitors: ${st3.competitors.join(', ')}`,
                ],
                summaryColor: '#c084fc',
            });
        }

        return items;
    }, [newsItems, startups]);

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
    newsItems: NewsItem[];
    rideStyle: RideStyle;
}

function SceneContent({ cyclingData, newsItems, rideStyle }: SceneContentProps) {
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
                newsItems={newsItems}
                speed={effectiveSpeed}
            />

            {/* NO post-processing — saves massive GPU overhead */}
        </>
    );
}

interface RiderSceneProps {
    cyclingData: CyclingData;
    newsItems: NewsItem[];
    rideStyle: RideStyle;
}

export const RiderScene: React.FC<RiderSceneProps> = ({
    cyclingData,
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
                    newsItems={newsItems}
                    rideStyle={rideStyle}
                />
            </Canvas>
        </div>
    );
};
