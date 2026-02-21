import React, { useMemo } from 'react';
import { NewsItem, StartupInfo } from '../../types';

/**
 * DataBillboard — renders data as Canvas textures (NO DOM = fast!)
 *
 * Previous approach used drei's Html component which creates real DOM
 * elements inside WebGL — extremely slow. This uses CanvasTexture
 * which renders text to a 2D canvas then uploads as a GPU texture.
 */

// ── Canvas texture renderer ──

function createTextTexture(
    drawFn: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
    width = 512,
    height = 256,
): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    // Transparent background with subtle dark tint
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = 'rgba(4, 8, 20, 0.4)';
    ctx.fillRect(0, 0, width, height);

    // Subtle glow border
    ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    drawFn(ctx, width, height);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    return tex;
}

import * as THREE from 'three';

// ── Billboard Frame ──

interface BillboardFrameProps {
    position: [number, number, number];
    rotation?: [number, number, number];
    width?: number;
    height?: number;
    glowColor?: string;
    texture: THREE.CanvasTexture;
}

export const BillboardFrame: React.FC<BillboardFrameProps> = ({
    position,
    rotation = [0, 0, 0],
    width = 3.8,
    height = 2.6,
    glowColor = '#00c2ff',
    texture,
}) => {
    return (
        <group position={position} rotation={rotation}>
            {/* Content plane with texture */}
            <mesh>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial map={texture} transparent />
            </mesh>

            {/* Glow border — 4 thin planes */}
            <mesh position={[0, height / 2, 0.01]}>
                <planeGeometry args={[width + 0.06, 0.05]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.9} />
            </mesh>
            <mesh position={[0, -height / 2, 0.01]}>
                <planeGeometry args={[width + 0.06, 0.05]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.9} />
            </mesh>
            <mesh position={[-width / 2, 0, 0.01]}>
                <planeGeometry args={[0.05, height]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.9} />
            </mesh>
            <mesh position={[width / 2, 0, 0.01]}>
                <planeGeometry args={[0.05, height]} />
                <meshBasicMaterial color={glowColor} transparent opacity={0.9} />
            </mesh>
        </group>
    );
};


export function createNewsTexture(item: NewsItem): THREE.CanvasTexture {
    return createTextTexture((ctx, w, h) => {
        const catColors: Record<string, string> = {
            tech: '#60a5fa', ai: '#c084fc', crypto: '#fbbf24', startup: '#34d399',
        };
        const catColor = catColors[item.category] || '#60a5fa';

        // Category
        ctx.fillStyle = catColor;
        ctx.font = 'bold 16px monospace';
        ctx.fillText(item.category.toUpperCase(), 30, 40);

        // Title (word wrap)
        ctx.fillStyle = '#e8ecf4';
        ctx.font = 'bold 26px sans-serif';
        const words = item.title.split(' ');
        let line = '';
        let y = 80;
        for (const word of words) {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > w - 60 && line) {
                ctx.fillText(line.trim(), 30, y);
                line = word + ' ';
                y += 34;
            } else {
                line = test;
            }
        }
        ctx.fillText(line.trim(), 30, y);

        // Source
        ctx.fillStyle = '#505c72';
        ctx.font = '16px monospace';
        ctx.fillText(`${item.source} · ${item.publishedAt}`, 30, h - 30);
    });
}

export function createStartupTexture(startup: StartupInfo): THREE.CanvasTexture {
    return createTextTexture((ctx, w, h) => {
        // Category tag
        ctx.fillStyle = '#c084fc';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(startup.category.toUpperCase(), 30, 30);

        // Name
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(startup.name, 30, 70);

        // Tagline
        ctx.fillStyle = '#00e5ff';
        ctx.font = 'italic 20px sans-serif';
        ctx.fillText(startup.tagline, 30, 100);

        // Description (word-wrapped)
        ctx.fillStyle = '#b8c4d8';
        ctx.font = '16px sans-serif';
        const words = startup.description.split(' ');
        let line = '';
        let y = 135;
        for (const word of words) {
            const test = line + word + ' ';
            if (ctx.measureText(test).width > w - 60 && line) {
                ctx.fillText(line.trim(), 30, y);
                line = word + ' ';
                y += 22;
                if (y > 220) break;
            } else {
                line = test;
            }
        }
        ctx.fillText(line.trim(), 30, y);

        // Funding
        ctx.fillStyle = '#00e676';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`💰 ${startup.funding}`, 30, h - 70);

        // Founded
        ctx.fillStyle = '#818cf8';
        ctx.font = '14px monospace';
        ctx.fillText(`Founded ${startup.founded}`, 30, h - 48);

        // Competitors
        ctx.fillStyle = '#ff6b6b';
        ctx.font = 'bold 14px monospace';
        ctx.fillText('Competitors:', 30, h - 25);
        ctx.fillStyle = '#f59e0b';
        ctx.font = '14px monospace';
        ctx.fillText(startup.competitors.join('  ·  '), 140, h - 25);
    }, 600, 320);
}

export function createSummaryTexture(lines: string[], color: string = '#00e5ff'): THREE.CanvasTexture {
    const CANVAS_W = 800;
    const PADDING = 40;
    const MAX_FONT = 28;
    const MIN_FONT = 14;
    const LINE_H = 38;

    return createTextTexture((ctx, w, h) => {
        ctx.fillStyle = color;
        ctx.textAlign = 'center';

        lines.forEach((line, i) => {
            // Auto-scale: find largest font that fits
            let fontSize = MAX_FONT;
            ctx.font = `bold ${fontSize}px monospace`;
            while (ctx.measureText(line).width > w - PADDING * 2 && fontSize > MIN_FONT) {
                fontSize -= 2;
                ctx.font = `bold ${fontSize}px monospace`;
            }

            // If still too long, truncate with ellipsis
            let text = line;
            if (ctx.measureText(text).width > w - PADDING * 2) {
                while (ctx.measureText(text + '…').width > w - PADDING * 2 && text.length > 10) {
                    text = text.slice(0, -1);
                }
                text += '…';
            }

            ctx.fillText(text, w / 2, 40 + i * LINE_H);
        });
    }, CANVAS_W, 40 + lines.length * LINE_H + 20);
}
