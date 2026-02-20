import React, { useMemo } from 'react';
import { CryptoTicker, StockQuote, NewsItem, StartupInfo } from '../../types';

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

// ── Texture factories ──

function drawMiniChart(
    ctx: CanvasRenderingContext2D,
    data: number[],
    x: number, y: number, w: number, h: number,
    color: string,
) {
    if (!data || data.length < 2) return;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    // Fill gradient
    const grad = ctx.createLinearGradient(x, y, x, y + h);
    grad.addColorStop(0, color + '40');
    grad.addColorStop(1, color + '00');

    ctx.beginPath();
    ctx.moveTo(x, y + h);
    data.forEach((v, i) => {
        const px = x + (i / (data.length - 1)) * w;
        const py = y + h - ((v - min) / range) * h;
        ctx.lineTo(px, py);
    });
    ctx.lineTo(x + w, y + h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((v, i) => {
        const px = x + (i / (data.length - 1)) * w;
        const py = y + h - ((v - min) / range) * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.5;
    ctx.stroke();
}

export function createCryptoTexture(coin: CryptoTicker): THREE.CanvasTexture {
    return createTextTexture((ctx, w, h) => {
        const isUp = coin.change24h >= 0;
        const changeColor = isUp ? '#00e676' : '#ff5252';

        // Symbol
        ctx.fillStyle = '#e8ecf4';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(coin.symbol, 30, 55);

        // Change badge
        ctx.fillStyle = changeColor;
        ctx.font = 'bold 24px monospace';
        const changeText = `${isUp ? '▲' : '▼'} ${Math.abs(coin.change24h).toFixed(2)}%`;
        ctx.fillText(changeText, w - 30 - ctx.measureText(changeText).width, 52);

        // Price
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 48px monospace';
        const priceStr = coin.price >= 1
            ? '$' + coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
            : '$' + coin.price.toFixed(4);
        ctx.fillText(priceStr, 30, 112);

        // Name
        ctx.fillStyle = '#505c72';
        ctx.font = '18px monospace';
        ctx.fillText(coin.name, 30, 142);

        // Chart
        drawMiniChart(ctx, coin.sparkline, 25, 155, w - 50, 80, changeColor);
    });
}

export function createStockTexture(stock: StockQuote): THREE.CanvasTexture {
    return createTextTexture((ctx, w, h) => {
        const isUp = stock.change >= 0;
        const changeColor = isUp ? '#00e676' : '#ff5252';

        // Symbol + name
        ctx.fillStyle = '#e8ecf4';
        ctx.font = 'bold 36px monospace';
        ctx.fillText(stock.symbol, 30, 55);
        ctx.fillStyle = '#505c72';
        ctx.font = '16px monospace';
        ctx.fillText(stock.name, 30 + ctx.measureText(stock.symbol).width + 15, 52);

        // Price
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 44px monospace';
        ctx.fillText('$' + stock.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 30, 108);

        // Change
        ctx.fillStyle = changeColor;
        ctx.font = 'bold 22px monospace';
        const sign = isUp ? '+' : '';
        ctx.fillText(`${sign}${stock.change.toFixed(2)} (${Math.abs(stock.changePercent).toFixed(2)}%)`, 30, 140);

        // Chart
        drawMiniChart(ctx, stock.data.map(d => d.value), 25, 155, w - 50, 80, changeColor);
    });
}

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
    return createTextTexture((ctx, w, h) => {
        ctx.fillStyle = color;
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        lines.forEach((line, i) => {
            ctx.fillText(line, w / 2, 40 + i * 38);
        });
    }, 600, 40 + lines.length * 38 + 20);
}
