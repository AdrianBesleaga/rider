import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Cyberpunk Environment — starry night sky with moon, grid floor, no particles
 */

function GridFloor() {
    const gridMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color('#00c2ff') },
                uOpacity: { value: 0.28 },
            },
            vertexShader: `
        varying vec2 vUv;
        varying float vDist;
        void main() {
          vUv = uv * 60.0;
          vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
          vDist = -mvPos.z;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
            fragmentShader: `
        uniform vec3 uColor;
        uniform float uOpacity;
        varying vec2 vUv;
        varying float vDist;
        void main() {
          vec2 grid = abs(fract(vUv - 0.5) - 0.5) / fwidth(vUv);
          float line = min(grid.x, grid.y);
          float alpha = 1.0 - min(line, 1.0);
          float fade = 1.0 - smoothstep(40.0, 180.0, vDist);
          gl_FragColor = vec4(uColor, alpha * uOpacity * fade);
        }
      `,
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
        });
    }, []);

    return (
        <mesh rotation-x={-Math.PI / 2} position={[0, -0.01, 0]} material={gridMaterial}>
            <planeGeometry args={[400, 400]} />
        </mesh>
    );
}

function Starfield() {
    const starsRef = useRef<THREE.Points>(null);

    const { geometry, sizes } = useMemo(() => {
        const count = 6000;
        const pos = new Float32Array(count * 3);
        const sizeArr = new Float32Array(count);
        for (let i = 0; i < count; i++) {
            // Distribute on a large hemisphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI * 0.48;
            const r = 100 + Math.random() * 100;
            pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            pos[i * 3 + 1] = r * Math.cos(phi) + 8;
            pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
            // Mostly tiny, a few brighter
            sizeArr[i] = Math.random() > 0.97 ? 0.6 + Math.random() * 0.5 : 0.1 + Math.random() * 0.25;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        geo.setAttribute('size', new THREE.BufferAttribute(sizeArr, 1));
        return { geometry: geo, sizes: sizeArr };
    }, []);

    // Gentle twinkle
    useFrame((state) => {
        if (!starsRef.current) return;
        starsRef.current.rotation.y = state.clock.elapsedTime * 0.002;
    });

    return (
        <points ref={starsRef} geometry={geometry}>
            <pointsMaterial
                size={0.3}
                color="#ffffff"
                transparent
                opacity={0.85}
                sizeAttenuation
                fog={false}
            />
        </points>
    );
}

function Moon() {
    // Moon surface texture with craters
    const moonTex = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d')!;
        // Base color
        ctx.fillStyle = '#c8cdd4';
        ctx.fillRect(0, 0, 256, 256);
        // Dark maria (seas)
        const maria = [[80, 90, 45], [160, 130, 35], [120, 170, 28], [55, 160, 22]];
        maria.forEach(([x, y, r]) => {
            ctx.fillStyle = 'rgba(140,145,155,0.5)';
            ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
        });
        // Small craters
        for (let i = 0; i < 30; i++) {
            const cx = Math.random() * 256, cy = Math.random() * 256, cr = 2 + Math.random() * 8;
            ctx.fillStyle = `rgba(100,105,115,${0.2 + Math.random() * 0.3})`;
            ctx.beginPath(); ctx.arc(cx, cy, cr, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = `rgba(180,185,195,${0.15 + Math.random() * 0.15})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath(); ctx.arc(cx, cy, cr + 0.5, 0, Math.PI * 2); ctx.stroke();
        }
        const t = new THREE.CanvasTexture(c);
        t.needsUpdate = true;
        return t;
    }, []);

    // Glow halo
    const glowTex = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 128; c.height = 128;
        const ctx = c.getContext('2d')!;
        const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
        g.addColorStop(0, 'rgba(200, 215, 240, 0.5)');
        g.addColorStop(0.3, 'rgba(150, 175, 220, 0.15)');
        g.addColorStop(0.6, 'rgba(100, 140, 200, 0.04)');
        g.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 128, 128);
        const t = new THREE.CanvasTexture(c);
        t.needsUpdate = true;
        return t;
    }, []);

    return (
        <group position={[3, 10, -25]}>
            {/* Moon sphere with surface texture */}
            <mesh>
                <sphereGeometry args={[1.2, 32, 32]} />
                <meshBasicMaterial map={moonTex} />
            </mesh>
            {/* Glow halo */}
            <mesh>
                <planeGeometry args={[8, 8]} />
                <meshBasicMaterial map={glowTex} transparent depthWrite={false} fog={false} />
            </mesh>
            {/* Subtle moon light */}
            <pointLight intensity={0.3} distance={200} color="#8badc8" />
        </group>
    );
}

function HorizonGlow() {
    const tex = useMemo(() => {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 256;
        const ctx = c.getContext('2d')!;
        const g = ctx.createLinearGradient(0, 0, 0, 256);
        g.addColorStop(0, 'rgba(0, 0, 0, 0)');
        g.addColorStop(0.3, 'rgba(0, 30, 50, 0.05)');
        g.addColorStop(0.6, 'rgba(0, 80, 120, 0.12)');
        g.addColorStop(0.8, 'rgba(0, 160, 200, 0.18)');
        g.addColorStop(0.95, 'rgba(0, 200, 240, 0.12)');
        g.addColorStop(1, 'rgba(0, 180, 220, 0.06)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 256);
        const t = new THREE.CanvasTexture(c);
        t.needsUpdate = true;
        return t;
    }, []);

    return (
        <mesh position={[0, 20, -160]}>
            <planeGeometry args={[200, 45]} />
            <meshBasicMaterial map={tex} transparent depthWrite={false} fog={false} />
        </mesh>
    );
}

function DistantSkyline() {
    const buildings = useMemo(() => {
        const items: Array<{ x: number; z: number; h: number; w: number; color: string }> = [];
        const colors = ['#0a1628', '#0d1a30', '#0c1525', '#101e38', '#0b1420'];
        const accents = ['#00e5ff', '#c084fc', '#ff3d9a', '#818cf8', '#06d6c4'];
        for (let i = 0; i < 25; i++) {
            items.push({
                x: (Math.random() - 0.5) * 100,
                z: -120 - Math.random() * 60,
                h: 4 + Math.random() * 16,
                w: 2 + Math.random() * 5,
                color: colors[i % 5],
            });
        }
        return items.map((b, i) => ({ ...b, accent: accents[i % 5] }));
    }, []);

    return (
        <group>
            {buildings.map((b, i) => (
                <group key={i} position={[b.x, 0, b.z]}>
                    <mesh position={[0, b.h / 2, 0]}>
                        <boxGeometry args={[b.w, b.h, b.w * 0.8]} />
                        <meshStandardMaterial color={b.color} roughness={0.9} />
                    </mesh>
                    {/* Glowing top accent */}
                    <mesh position={[0, b.h + 0.05, 0]} rotation-x={-Math.PI / 2}>
                        <planeGeometry args={[b.w * 0.5, b.w * 0.4]} />
                        <meshBasicMaterial color={b.accent} transparent opacity={0.5} />
                    </mesh>
                    {/* Window dots */}
                    {Array.from({ length: Math.floor(b.h / 3) }, (_, r) => (
                        <mesh key={r} position={[0, (r + 1) * 2.5, b.w * 0.41]}>
                            <planeGeometry args={[b.w * 0.7, 0.1]} />
                            <meshBasicMaterial color={b.accent} transparent opacity={0.15} />
                        </mesh>
                    ))}
                </group>
            ))}
        </group>
    );
}

interface EnvironmentProps {
    speed: number;
}

export const CyberEnvironment: React.FC<EnvironmentProps> = ({ speed }) => {
    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} color="#8badcc" />
            <directionalLight position={[5, 15, 10]} intensity={0.6} color="#5de0ff" />
            <directionalLight position={[-8, 10, -5]} intensity={0.3} color="#c084fc" />
            <pointLight position={[0, 6, 4]} intensity={0.8} distance={20} color="#00c2ff" />

            {/* Fog */}
            <fog attach="fog" args={['#060a12', 50, 180]} />

            {/* Dark night sky background */}
            <color attach="background" args={['#04060e']} />

            <GridFloor />
            <Starfield />
            <Moon />
            <HorizonGlow />
            <DistantSkyline />
        </>
    );
};
