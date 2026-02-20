import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Infinite Road — PERF-OPTIMIZED
 *
 * Optimizations:
 * - Shared materials (one per type)
 * - Reduced dash count
 * - Brighter edge glow lines matching concept art
 */

const CHUNK_LENGTH = 40;
const NUM_CHUNKS = 10;
const ROAD_WIDTH = 8;

export const Road: React.FC<{ speed: number }> = ({ speed }) => {
    const groupRef = useRef<THREE.Group>(null);

    // Shared materials — create once
    const mats = useMemo(() => ({
        road: new THREE.MeshStandardMaterial({ color: '#0d1117', roughness: 0.9, metalness: 0.1 }),
        dash: new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 1.0 }),
        edge: new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 1.0 }),
        edgeGlow: new THREE.MeshBasicMaterial({ color: '#00e5ff', transparent: true, opacity: 0.25, depthWrite: false }),
    }), []);

    const chunkOffsets = useMemo(() =>
        Array.from({ length: NUM_CHUNKS }, (_, i) => -i * CHUNK_LENGTH),
        []);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const moveSpeed = (Math.max(speed, 8) / 3.6) * delta;

        groupRef.current.children.forEach((child) => {
            child.position.z += moveSpeed;
            if (child.position.z > CHUNK_LENGTH) {
                child.position.z -= NUM_CHUNKS * CHUNK_LENGTH;
            }
        });
    });

    return (
        <group ref={groupRef}>
            {chunkOffsets.map((offset, i) => (
                <group key={i} position={[0, 0, offset]}>
                    {/* Road surface */}
                    <mesh rotation-x={-Math.PI / 2} position={[0, 0.005, 0]} material={mats.road}>
                        <planeGeometry args={[ROAD_WIDTH, CHUNK_LENGTH]} />
                    </mesh>

                    {/* Center dashes */}
                    {Array.from({ length: 6 }).map((_, j) => (
                        <mesh
                            key={j}
                            rotation-x={-Math.PI / 2}
                            position={[0, 0.012, -CHUNK_LENGTH / 2 + j * 6.5 + 2]}
                            material={mats.dash}
                        >
                            <planeGeometry args={[0.15, 3.5]} />
                        </mesh>
                    ))}

                    {/* Left edge line — bright, wide neon (concept art) */}
                    <mesh
                        rotation-x={-Math.PI / 2}
                        position={[-ROAD_WIDTH / 2 + 0.08, 0.012, 0]}
                        material={mats.edge}
                    >
                        <planeGeometry args={[0.18, CHUNK_LENGTH]} />
                    </mesh>

                    {/* Right edge line */}
                    <mesh
                        rotation-x={-Math.PI / 2}
                        position={[ROAD_WIDTH / 2 - 0.08, 0.012, 0]}
                        material={mats.edge}
                    >
                        <planeGeometry args={[0.18, CHUNK_LENGTH]} />
                    </mesh>

                    {/* Left edge GLOW strip (fake bloom) */}
                    <mesh
                        rotation-x={-Math.PI / 2}
                        position={[-ROAD_WIDTH / 2 + 0.08, 0.008, 0]}
                        material={mats.edgeGlow}
                    >
                        <planeGeometry args={[0.8, CHUNK_LENGTH]} />
                    </mesh>
                    {/* Right edge GLOW strip */}
                    <mesh
                        rotation-x={-Math.PI / 2}
                        position={[ROAD_WIDTH / 2 - 0.08, 0.008, 0]}
                        material={mats.edgeGlow}
                    >
                        <planeGeometry args={[0.8, CHUNK_LENGTH]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};
