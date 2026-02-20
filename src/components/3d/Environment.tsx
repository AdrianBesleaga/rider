import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/**
 * Cyberpunk Environment — brighter grid floor, starfield, ambient glow
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

    const geometry = useMemo(() => {
        const count = 2000;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 300;
            pos[i * 3 + 1] = Math.random() * 80 + 15;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 300;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return geo;
    }, []);

    useFrame((_, delta) => {
        if (starsRef.current) {
            starsRef.current.rotation.y += delta * 0.001;
        }
    });

    return (
        <points ref={starsRef} geometry={geometry}>
            <pointsMaterial
                size={0.4}
                color="#ffffff"
                transparent
                opacity={0.7}
                sizeAttenuation
            />
        </points>
    );
}

function AmbientParticles({ speed }: { speed: number }) {
    const particlesRef = useRef<THREE.Points>(null);

    const geometry = useMemo(() => {
        const count = 150;
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 24;
            pos[i * 3 + 1] = Math.random() * 6 + 0.5;
            pos[i * 3 + 2] = Math.random() * -80;
        }
        const geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        return geo;
    }, []);

    useFrame((_, delta) => {
        if (!particlesRef.current) return;
        const posArr = particlesRef.current.geometry.attributes.position.array as Float32Array;
        const moveSpeed = Math.max(speed, 5) * 0.4 * delta;

        for (let i = 0; i < posArr.length / 3; i++) {
            posArr[i * 3 + 2] += moveSpeed;
            if (posArr[i * 3 + 2] > 8) {
                posArr[i * 3 + 2] = -80;
                posArr[i * 3] = (Math.random() - 0.5) * 24;
                posArr[i * 3 + 1] = Math.random() * 6 + 0.5;
            }
        }
        particlesRef.current.geometry.attributes.position.needsUpdate = true;
    });

    return (
        <points ref={particlesRef} geometry={geometry}>
            <pointsMaterial
                size={0.1}
                color="#00c2ff"
                transparent
                opacity={0.6}
                sizeAttenuation
            />
        </points>
    );
}

interface EnvironmentProps {
    speed: number;
}

export const CyberEnvironment: React.FC<EnvironmentProps> = ({ speed }) => {
    return (
        <>
            {/* Stronger lighting for better visibility */}
            <ambientLight intensity={0.4} color="#8badcc" />
            <directionalLight position={[5, 15, 10]} intensity={0.6} color="#5de0ff" />
            <directionalLight position={[-8, 10, -5]} intensity={0.3} color="#c084fc" />
            {/* Backlight on rider */}
            <pointLight position={[0, 6, 4]} intensity={0.8} distance={20} color="#00c2ff" />

            {/* Fog — pushed further for visibility */}
            <fog attach="fog" args={['#060a12', 50, 180]} />

            <color attach="background" args={['#060a12']} />

            <GridFloor />
            <Starfield />
            <AmbientParticles speed={speed} />
        </>
    );
};
