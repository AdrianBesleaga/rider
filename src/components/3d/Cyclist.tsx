import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Loads a real bike model from the downloaded GLB.
 *
 * The GLB contains 3 bikes. We use bike 3 (x ≈ 6.28):
 *   front_wheel, fork001, handlebar001, Cylinder002 (frame),
 *   free_wheel, bracket002, chain001, saddle002, brake
 *
 * Model space: wheel diameter ≈ 3m → scale to ~0.7m → factor ≈ 0.233
 * Wheels are front_wheel (z≈-2.54) and free_wheel (z≈2.58)
 */

interface CyclistProps {
    cadence: number;
}

const GLB_PATH = '/uploads_files_3066782_bikes.glb';
useGLTF.preload(GLB_PATH);

// Names of bike-1 parts (x ≈ -7)
const BIKE_PARTS = [
    'bracket', 'frame', 'freewheel', 'front_wheel001',
    'handlebar', 'saddle',
];
const WHEEL_NAMES = ['freewheel', 'front_wheel001'];
const BIKE_CENTER_X = -7.02;
const BIKE_CENTER_Z = 0;
const SCALE = 0.17; // ~4.1m wheel → ~0.7m

export const Cyclist: React.FC<CyclistProps> = ({ cadence }) => {
    const { scene } = useGLTF(GLB_PATH);
    const pedalAngle = useRef(0);

    // Extract only bike-1 parts, clone them, center and scale
    const bikeGroup = useMemo(() => {
        const group = new THREE.Group();

        scene.traverse((child) => {
            if (BIKE_PARTS.includes(child.name)) {
                const clone = child.clone(true);
                // Center: shift so bike is at origin
                clone.position.x -= BIKE_CENTER_X;
                clone.position.z -= BIKE_CENTER_Z;

                // Add cyan emissive glow to wheel rim meshes
                if (WHEEL_NAMES.includes(child.name)) {
                    clone.traverse((part) => {
                        if ((part as THREE.Mesh).isMesh) {
                            const mesh = part as THREE.Mesh;
                            const oldMat = mesh.material as THREE.MeshStandardMaterial;
                            // Clone material so we don't affect the cached original
                            const mat = oldMat.clone();
                            mat.emissive = new THREE.Color('#00e5ff');
                            mat.emissiveIntensity = 0.6;
                            mesh.material = mat;
                        }
                    });
                }

                group.add(clone);
            }
        });

        // Add glowing rim rings (fake bloom halos) on each wheel
        const glowRingMat = new THREE.MeshBasicMaterial({
            color: '#00e5ff', transparent: true, opacity: 0.2,
            depthWrite: false, side: THREE.DoubleSide,
        });
        // Wheel centers in model space (from inspection)
        const wheelCenters = [
            { y: 2.09, z: 3.07 },   // freewheel (rear)
            { y: 2.09, z: -3.12 },  // front_wheel001
        ];
        wheelCenters.forEach(({ y, z }) => {
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(2.05, 0.15, 8, 48),
                glowRingMat
            );
            ring.position.set(0, y, z - BIKE_CENTER_Z);
            ring.rotation.y = Math.PI / 2;
            group.add(ring);
        });

        // Scale the whole group
        group.scale.setScalar(SCALE);
        group.position.y = 0;

        return group;
    }, [scene]);

    // Find wheel refs for spinning
    const wheels = useMemo(() => {
        const found: THREE.Object3D[] = [];
        bikeGroup.traverse((child) => {
            if (WHEEL_NAMES.includes(child.name)) {
                found.push(child);
            }
        });
        return found;
    }, [bikeGroup]);


    useFrame((_, delta) => {
        const rps = (cadence / 60) * Math.PI * 2;
        pedalAngle.current += rps * delta;

        // Spin wheels forward
        wheels.forEach((w) => {
            w.rotation.x = -pedalAngle.current * 2.5;
        });
    });

    // Ground glow
    const glowTex = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d')!;
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(0, 229, 255, 0.5)');
        g.addColorStop(0.35, 'rgba(0, 229, 255, 0.18)');
        g.addColorStop(1, 'rgba(0, 229, 255, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
        const t = new THREE.CanvasTexture(c);
        t.needsUpdate = true;
        return t;
    }, []);

    return (
        <group>
            <primitive object={bikeGroup} />

            {/* Ground glow */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0.01, 0]}>
                <planeGeometry args={[2.5, 2.5]} />
                <meshBasicMaterial map={glowTex} transparent depthWrite={false} />
            </mesh>

            {/* Bike glow light */}
            <pointLight position={[0, 0.35, 0]} intensity={0.8} distance={3} color="#00e5ff" />
        </group>
    );
};
