import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * CityProps — neon-lit buildings matching the concept art
 *
 * Each building has:
 * - Dark body with colored emissive tint
 * - Multiple glowing window rows (horizontal strips)
 * - Vertical neon accent line on one face
 * - Rooftop glow accent
 * - Colors: cyan, purple, magenta, blue, teal
 */

const PROPS_PER_SIDE = 12;
const SPREAD_Z = 220;

interface BuildingData {
    x: number;
    z: number;
    height: number;
    width: number;
    depth: number;
    colorIndex: number;
    windowRows: number;
    hasRoofGlow: boolean;
    hasVertStrip: boolean;
}

export const CityProps: React.FC<{ speed: number }> = ({ speed }) => {
    const groupRef = useRef<THREE.Group>(null);

    const mats = useMemo(() => {
        // Building body colors — dark with subtle emissive tint
        const bodyColors = [
            { color: '#0c1222', emissive: '#001830', emissiveIntensity: 0.15 },
            { color: '#0f172a', emissive: '#0a0030', emissiveIntensity: 0.12 },
            { color: '#1e1b4b', emissive: '#150040', emissiveIntensity: 0.18 },
            { color: '#172554', emissive: '#001a40', emissiveIntensity: 0.1 },
            { color: '#0d0d1f', emissive: '#0c0028', emissiveIntensity: 0.15 },
        ];
        // Accent glow colors — vibrant neon
        const accentColors = ['#00e5ff', '#c084fc', '#ff3d9a', '#818cf8', '#06d6c4', '#f59e0b'];

        return {
            bodies: bodyColors.map(c => new THREE.MeshStandardMaterial({
                color: c.color, emissive: c.emissive,
                emissiveIntensity: c.emissiveIntensity,
                roughness: 0.85, metalness: 0.15,
            })),
            // Glowing window strips
            windows: accentColors.map(c => new THREE.MeshBasicMaterial({
                color: c, transparent: true, opacity: 0.6,
            })),
            // Bright neon accents (vertical strips, roof)
            accents: accentColors.map(c => new THREE.MeshBasicMaterial({
                color: c, transparent: true, opacity: 0.9,
            })),
            // Soft glow around accents (fake bloom)
            glows: accentColors.map(c => new THREE.MeshBasicMaterial({
                color: c, transparent: true, opacity: 0.15, depthWrite: false,
            })),
        };
    }, []);

    const buildings = useMemo(() => {
        const items: BuildingData[] = [];
        for (let side = 0; side < 2; side++) {
            const sign = side === 0 ? -1 : 1;
            for (let i = 0; i < PROPS_PER_SIDE; i++) {
                items.push({
                    x: sign * (12 + Math.random() * 14),
                    z: -(Math.random() * SPREAD_Z),
                    height: 6 + Math.random() * 20,
                    width: 3 + Math.random() * 5,
                    depth: 3 + Math.random() * 5,
                    colorIndex: Math.floor(Math.random() * 5),
                    windowRows: 2 + Math.floor(Math.random() * 4),
                    hasRoofGlow: Math.random() > 0.3,
                    hasVertStrip: Math.random() > 0.4,
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
            {buildings.map((b, i) => {
                const accentIdx = (b.colorIndex + i) % 6;
                return (
                    <group key={i} position={[b.x, 0, b.z]}>
                        {/* Building body */}
                        <mesh
                            position={[0, b.height / 2, 0]}
                            material={mats.bodies[b.colorIndex]}
                        >
                            <boxGeometry args={[b.width, b.height, b.depth]} />
                        </mesh>

                        {/* Glowing window rows — horizontal strips on front face */}
                        {Array.from({ length: b.windowRows }, (_, r) => {
                            const rowY = (b.height * (r + 1)) / (b.windowRows + 1);
                            return (
                                <mesh
                                    key={`w${r}`}
                                    position={[0, rowY, b.depth / 2 + 0.02]}
                                    material={mats.windows[accentIdx]}
                                >
                                    <planeGeometry args={[b.width * 0.8, 0.15]} />
                                </mesh>
                            );
                        })}

                        {/* Glowing window rows — back face */}
                        {Array.from({ length: b.windowRows }, (_, r) => {
                            const rowY = (b.height * (r + 1)) / (b.windowRows + 1);
                            return (
                                <mesh
                                    key={`wb${r}`}
                                    position={[0, rowY, -b.depth / 2 - 0.02]}
                                    rotation-y={Math.PI}
                                    material={mats.windows[accentIdx]}
                                >
                                    <planeGeometry args={[b.width * 0.8, 0.15]} />
                                </mesh>
                            );
                        })}

                        {/* Vertical neon accent strip — side face */}
                        {b.hasVertStrip && (
                            <>
                                <mesh
                                    position={[b.width / 2 + 0.02, b.height / 2, 0]}
                                    rotation-y={Math.PI / 2}
                                    material={mats.accents[accentIdx]}
                                >
                                    <planeGeometry args={[0.06, b.height * 0.85]} />
                                </mesh>
                                {/* Glow around vert strip */}
                                <mesh
                                    position={[b.width / 2 + 0.01, b.height / 2, 0]}
                                    rotation-y={Math.PI / 2}
                                    material={mats.glows[accentIdx]}
                                >
                                    <planeGeometry args={[0.6, b.height * 0.85]} />
                                </mesh>
                            </>
                        )}

                        {/* Rooftop glow accent */}
                        {b.hasRoofGlow && (
                            <>
                                <mesh
                                    position={[0, b.height + 0.02, 0]}
                                    rotation-x={-Math.PI / 2}
                                    material={mats.accents[accentIdx]}
                                >
                                    <planeGeometry args={[b.width * 0.6, b.depth * 0.6]} />
                                </mesh>
                                {/* Rooftop glow spread */}
                                <mesh
                                    position={[0, b.height + 0.01, 0]}
                                    rotation-x={-Math.PI / 2}
                                    material={mats.glows[accentIdx]}
                                >
                                    <planeGeometry args={[b.width * 1.2, b.depth * 1.2]} />
                                </mesh>
                            </>
                        )}
                    </group>
                );
            })}
        </group>
    );
};
