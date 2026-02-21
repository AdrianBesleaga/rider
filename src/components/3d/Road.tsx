import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RideStyle } from '../../types';
import { curveX, curveTangent, ROAD_CONSTANTS } from '../../services/roadCurve';

/**
 * Infinite Curved Road — procedural S-curves
 *
 * Road path follows a sine wave on the X axis for gentle S-curves.
 * Supports two visual styles:
 *   - road: dark asphalt + cyan neon edges
 *   - mtb:  earth-toned surface + amber/orange edges, wider
 *
 * Geometry: we build a ribbon mesh by sampling points along a
 * parametric curve and constructing a triangle strip.
 */

const { NUM_SEGMENTS, TOTAL_LENGTH } = ROAD_CONSTANTS;

interface RoadStyleConfig {
    roadColor: string;
    dashColor: string;
    edgeColor: string;
    edgeGlowColor: string;
    edgeGlowOpacity: number;
    roadWidth: number;
}

const STYLE_CONFIGS: Record<RideStyle, RoadStyleConfig> = {
    road: {
        roadColor: '#0d1117',
        dashColor: '#00e5ff',
        edgeColor: '#00e5ff',
        edgeGlowColor: '#00e5ff',
        edgeGlowOpacity: 0.25,
        roadWidth: 8,
    },
    mtb: {
        roadColor: '#2a1f0e',
        dashColor: '#f59e0b',
        edgeColor: '#f59e0b',
        edgeGlowColor: '#d97706',
        edgeGlowOpacity: 0.2,
        roadWidth: 10,
    },
};

/** Build a flat ribbon geometry following the S-curve */
function buildRoadGeometry(halfWidth: number): THREE.BufferGeometry {
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const step = TOTAL_LENGTH / NUM_SEGMENTS;

    for (let i = 0; i <= NUM_SEGMENTS; i++) {
        const z = -i * step;
        const cx = curveX(z);
        const { px, pz } = curveTangent(z);

        positions.push(cx - px * halfWidth, 0.005, z - pz * halfWidth);
        positions.push(cx + px * halfWidth, 0.005, z + pz * halfWidth);

        const v = i / NUM_SEGMENTS;
        uvs.push(0, v, 1, v);

        if (i < NUM_SEGMENTS) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();
    return geo;
}

/** Build a thin ribbon following the curve at a lateral offset (for edge lines) */
function buildEdgeGeometry(halfWidth: number, offset: number, lineHalfWidth: number): THREE.BufferGeometry {
    const positions: number[] = [];
    const indices: number[] = [];
    const step = TOTAL_LENGTH / NUM_SEGMENTS;

    for (let i = 0; i <= NUM_SEGMENTS; i++) {
        const z = -i * step;
        const cx = curveX(z);
        const { px, pz } = curveTangent(z);

        const edgeCx = cx + px * offset;
        const edgeCz = z + pz * offset;

        positions.push(edgeCx - px * lineHalfWidth, 0.012, edgeCz - pz * lineHalfWidth);
        positions.push(edgeCx + px * lineHalfWidth, 0.012, edgeCz + pz * lineHalfWidth);

        if (i < NUM_SEGMENTS) {
            const base = i * 2;
            indices.push(base, base + 1, base + 2);
            indices.push(base + 1, base + 3, base + 2);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    return geo;
}

/** Build dashes along the center of the curve */
function buildDashGeometry(): { positions: [number, number, number]; rotation: number }[] {
    const dashes: { positions: [number, number, number]; rotation: number }[] = [];
    const dashSpacing = 6.5;
    const count = Math.floor(TOTAL_LENGTH / dashSpacing);

    for (let i = 0; i < count; i++) {
        const z = -i * dashSpacing;
        const cx = curveX(z);
        const { px, pz } = curveTangent(z);
        const angle = Math.atan2(px, pz);

        dashes.push({ positions: [cx, 0.012, z], rotation: angle });
    }
    return dashes;
}

interface RoadProps {
    speed: number;
    rideStyle: RideStyle;
}

export const Road: React.FC<RoadProps> = ({ speed, rideStyle }) => {
    const groupRef = useRef<THREE.Group>(null);
    const scrollRef = useRef(0);

    const config = STYLE_CONFIGS[rideStyle];
    const halfWidth = config.roadWidth / 2;

    // Build geometries
    const roadGeo = useMemo(() => buildRoadGeometry(halfWidth), [halfWidth]);
    const leftEdgeGeo = useMemo(() => buildEdgeGeometry(halfWidth, -halfWidth + 0.08, 0.09), [halfWidth]);
    const rightEdgeGeo = useMemo(() => buildEdgeGeometry(halfWidth, halfWidth - 0.08, 0.09), [halfWidth]);
    const leftGlowGeo = useMemo(() => buildEdgeGeometry(halfWidth, -halfWidth + 0.08, 0.4), [halfWidth]);
    const rightGlowGeo = useMemo(() => buildEdgeGeometry(halfWidth, halfWidth - 0.08, 0.4), [halfWidth]);
    const dashes = useMemo(() => buildDashGeometry(), []);

    // Materials — rebuild when style changes
    const mats = useMemo(() => ({
        road: new THREE.MeshStandardMaterial({ color: config.roadColor, roughness: 0.9, metalness: 0.1 }),
        dash: new THREE.MeshBasicMaterial({ color: config.dashColor, transparent: true, opacity: 1.0 }),
        edge: new THREE.MeshBasicMaterial({ color: config.edgeColor, transparent: true, opacity: 1.0 }),
        edgeGlow: new THREE.MeshBasicMaterial({
            color: config.edgeGlowColor, transparent: true,
            opacity: config.edgeGlowOpacity, depthWrite: false,
        }),
    }), [config]);

    useFrame((_, delta) => {
        if (!groupRef.current) return;
        const moveSpeed = (Math.max(speed, 8) / 3.6) * delta;
        scrollRef.current += moveSpeed;

        if (scrollRef.current > TOTAL_LENGTH) {
            scrollRef.current -= TOTAL_LENGTH;
        }

        groupRef.current.position.z = scrollRef.current;
    });

    return (
        <group ref={groupRef}>
            {/* Road surface */}
            <mesh geometry={roadGeo} material={mats.road} />

            {/* Center dashes */}
            {dashes.map((d, i) => (
                <mesh
                    key={i}
                    rotation-x={-Math.PI / 2}
                    rotation-z={d.rotation}
                    position={d.positions}
                    material={mats.dash}
                >
                    <planeGeometry args={[0.15, 3.5]} />
                </mesh>
            ))}

            {/* Edge lines */}
            <mesh geometry={leftEdgeGeo} material={mats.edge} />
            <mesh geometry={rightEdgeGeo} material={mats.edge} />

            {/* Edge glow strips */}
            <mesh geometry={leftGlowGeo} material={mats.edgeGlow} />
            <mesh geometry={rightGlowGeo} material={mats.edgeGlow} />
        </group>
    );
};
