import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { CyclingData, CryptoTicker as CryptoTickerType, StockQuote, NewsItem } from '../types';
import { CyberEnvironment } from './3d/Environment';
import { Road } from './3d/Road';
import { Cyclist } from './3d/Cyclist';
import { CityProps } from './3d/CityProps';
import {
    BillboardFrame,
    createCryptoTexture,
    createStockTexture,
    createNewsTexture,
} from './3d/DataBillboard';

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

function DataBillboards({ cryptoTickers, stockQuotes, newsItems, speed }: {
    cryptoTickers: CryptoTickerType[];
    stockQuotes: StockQuote[];
    newsItems: NewsItem[];
    speed: number;
}) {
    const groupRef = useRef<THREE.Group>(null);

    // Pre-render textures (only re-creates when data changes)
    const textures = useMemo(() => {
        const types: Array<'crypto' | 'stock' | 'news'> = [
            'crypto', 'stock', 'news', 'crypto', 'stock',
            'news', 'crypto', 'stock', 'news', 'crypto'
        ];

        return types.map((type, i) => {
            let texture: THREE.CanvasTexture;
            let glowColor: string;

            switch (type) {
                case 'crypto': {
                    const coin = cryptoTickers[i % cryptoTickers.length];
                    texture = createCryptoTexture(coin);
                    glowColor = coin.change24h >= 0 ? '#00e676' : '#ff5252';
                    break;
                }
                case 'stock': {
                    const stock = stockQuotes[i % stockQuotes.length];
                    texture = createStockTexture(stock);
                    glowColor = stock.change >= 0 ? '#00e676' : '#ff5252';
                    break;
                }
                case 'news': {
                    const item = newsItems[i % newsItems.length];
                    texture = createNewsTexture(item);
                    glowColor = '#c084fc';
                    break;
                }
            }

            return {
                texture,
                glowColor,
                side: i % 2 === 0 ? 'left' as const : 'right' as const,
                z: -i * 22 - 12,
            };
        });
    }, [cryptoTickers, stockQuotes, newsItems]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const moveSpeed = (Math.max(speed, 8) / 3.6) * delta;

        groupRef.current.children.forEach((child) => {
            child.position.z += moveSpeed;
            if (child.position.z > 25) {
                child.position.z -= 220;
            }
        });
    });

    // Staggered heights like concept art
    const heights = [3.5, 3.0, 4.0, 2.8, 3.8, 3.2, 3.6, 2.6, 4.2, 3.0];

    return (
        <group ref={groupRef}>
            {textures.map((bb, i) => (
                <BillboardFrame
                    key={i}
                    position={[bb.side === 'left' ? -7 : 7, heights[i], bb.z]}
                    rotation={[0, bb.side === 'left' ? 0.35 : -0.35, 0]}
                    glowColor={bb.glowColor}
                    texture={bb.texture}
                />
            ))}
        </group>
    );
}

interface SceneContentProps {
    cyclingData: CyclingData;
    cryptoTickers: CryptoTickerType[];
    stockQuotes: StockQuote[];
    newsItems: NewsItem[];
}

function SceneContent({ cyclingData, cryptoTickers, stockQuotes, newsItems }: SceneContentProps) {
    const effectiveSpeed = Math.max(cyclingData.speed, 12);

    return (
        <>
            <CameraControls />
            <CyberEnvironment speed={effectiveSpeed} />
            <Road speed={effectiveSpeed} />

            {/* Bike centered on road */}
            <Cyclist cadence={Math.max(cyclingData.cadence, 0)} />

            <CityProps speed={effectiveSpeed} />
            <DataBillboards
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
}

export const RiderScene: React.FC<RiderSceneProps> = ({
    cyclingData,
    cryptoTickers,
    stockQuotes,
    newsItems,
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
                />
            </Canvas>
        </div>
    );
};
