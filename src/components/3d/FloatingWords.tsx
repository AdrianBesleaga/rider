import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * CheckpointWords — staggered mini holographic panels between checkpoints
 *
 * Each word sits on a small translucent dark panel for contrast.
 * Words alternate left-right lanes (x = -2.5 / +2.5) to avoid overlap.
 * Spaced 12m apart at bike-height level.
 */

function createWordPanel(text: string, color: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    const fontSize = 36;
    const padX = 24;
    const padY = 12;
    canvas.height = fontSize + padY * 2;

    // Measure text
    const ctx = canvas.getContext('2d')!;
    ctx.font = `bold ${fontSize}px monospace`;
    const metrics = ctx.measureText(text);
    canvas.width = Math.ceil(metrics.width) + padX * 2;

    // Redraw after resize
    const ctx2 = canvas.getContext('2d')!;
    ctx2.clearRect(0, 0, canvas.width, canvas.height);

    // Dark panel backing
    ctx2.fillStyle = 'rgba(4, 8, 20, 0.65)';
    const r = 8;
    ctx2.beginPath();
    ctx2.roundRect(2, 2, canvas.width - 4, canvas.height - 4, r);
    ctx2.fill();

    // Subtle border
    ctx2.strokeStyle = color + '60';
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.roundRect(2, 2, canvas.width - 4, canvas.height - 4, r);
    ctx2.stroke();

    // Glowing text — double pass
    ctx2.shadowColor = color;
    ctx2.shadowBlur = 12;
    ctx2.font = `bold ${fontSize}px monospace`;
    ctx2.fillStyle = color;
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText(text, canvas.width / 2, canvas.height / 2);
    ctx2.fillText(text, canvas.width / 2, canvas.height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

const ACCENT_COLORS = ['#00e5ff', '#c084fc', '#ff3d9a', '#818cf8', '#06d6c4', '#f59e0b', '#00e676'];

interface CheckpointWordsProps {
    keywords: string[];
    glowColor: string;
}

export const CheckpointWords: React.FC<CheckpointWordsProps> = ({ keywords, glowColor }) => {
    const panels = useMemo(() => {
        return keywords.slice(0, 8).map((word, i) => {
            // First 2 use checkpoint accent, rest cycle through neon palette
            const color = i < 2 ? glowColor : ACCENT_COLORS[i % ACCENT_COLORS.length];
            const tex = createWordPanel(word, color);
            const w = (tex.image as HTMLCanvasElement).width / 72;
            const h = (tex.image as HTMLCanvasElement).height / 72;

            // Stagger: alternate left lane / center / right lane
            const lane = i % 3; // 0=left, 1=center, 2=right
            const xPos = lane === 0 ? -2.5 : lane === 1 ? 0 : 2.5;

            return {
                tex, w, h,
                x: xPos,
                z: 12 + i * 12, // 12m spacing behind the checkpoint
            };
        });
    }, [keywords, glowColor]);

    return (
        <>
            {panels.map((p, i) => (
                <mesh
                    key={i}
                    position={[p.x, -2.5, p.z]}
                >
                    <planeGeometry args={[p.w, p.h]} />
                    <meshBasicMaterial
                        map={p.tex}
                        transparent
                        depthWrite={false}
                        side={THREE.DoubleSide}
                    />
                </mesh>
            ))}
        </>
    );
};
