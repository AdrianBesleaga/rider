import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CityProps — PERF-OPTIMIZED
 *
 * Key optimizations:
 * - NO point lights on buildings (biggest perf saver)
 * - Fewer buildings (10 per side instead of 15)
 * - Shared materials via useMemo
 * - No neon poles (they had point lights)
 */

const PROPS_PER_SIDE = 10;
const SPREAD_Z = 200;

interface BuildingData {
    x: number;
    z: number;
    height: number;
    width: number;
    depth: number;
    colorIndex: number;
    accentIndex: number;
}

export const CityProps: React.FC<{ speed: number }> = ({ speed }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Shared materials — avoid recreating per building
    const materials = useMemo(() => {
        const colors = ['#0c1222', '#0f172a', '#1e1b4b', '#172554', '#1a1a2e'];
        const accents = ['#00c2ff', '#c084fc', '#818cf8', '#06b6d4', '#5de0ff'];
        return {
            buildings: colors.map(c => new THREE.MeshStandardMaterial({
                color: c, roughness: 0.8, metalness: 0.2,
            })),
            windows: accents.map(c => new THREE.MeshBasicMaterial({
                color: c, transparent: true, opacity: 0.2,
            })),
        };
    }, []);

    const buildings = useMemo(() => {
        const items: BuildingData[] = [];
        for (let side = 0; side < 2; side++) {
            const sign = side === 0 ? -1 : 1;
            for (let i = 0; i < PROPS_PER_SIDE; i++) {
                items.push({
                    x: sign * (15 + Math.random() * 12),
                    z: -(Math.random() * SPREAD_Z),
                    height: 6 + Math.random() * 18,
                    width: 3 + Math.random() * 5,
                    depth: 3 + Math.random() * 5,
                    colorIndex: Math.floor(Math.random() * 5),
                    accentIndex: Math.floor(Math.random() * 5),
                });
            }
        }
        return items;
    }, []);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const moveSpeed = (Math.max(speed, 8) / 3.6) * delta;
        groupRef.current.children.forEach((child) => {
            child.position.z += moveSpeed;
            if (child.position.z > 30) child.position.z -= SPREAD_Z + 30;
        });
    });

    return (
        <group ref={groupRef}>
            {buildings.map((b, i) => (
                <group key={i} position={[b.x, 0, b.z]}>
                    <mesh
                        position={[0, b.height / 2, 0]}
                        material={materials.buildings[b.colorIndex]}
                    >
                        <boxGeometry args={[b.width, b.height, b.depth]} />
                    </mesh>
                    {/* Single emissive strip per building (cheap) */}
                    <mesh
                        position={[b.width / 2 + 0.01, b.height * 0.6, 0]}
                        material={materials.windows[b.accentIndex]}
                    >
                        <planeGeometry args={[0.01, b.height * 0.5]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};
