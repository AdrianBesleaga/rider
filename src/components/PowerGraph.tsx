import React, { useRef, useEffect } from 'react';
import { PowerSample } from '../types';
import './PowerGraph.css';

interface Props {
    samples: PowerSample[];
    maxSamples?: number;
}

export const PowerGraph: React.FC<Props> = ({ samples, maxSamples = 300 }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const w = rect.width;
        const h = rect.height;
        const padding = { top: 20, right: 10, bottom: 25, left: 45 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        // Clear
        ctx.clearRect(0, 0, w, h);

        if (samples.length < 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '12px "JetBrains Mono"';
            ctx.textAlign = 'center';
            ctx.fillText('Waiting for power data...', w / 2, h / 2);
            return;
        }

        const visibleSamples = samples.slice(-maxSamples);
        const powers = visibleSamples.map(s => s.power);
        const minPower = 0;
        const maxPower = Math.max(400, Math.ceil(Math.max(...powers) / 50) * 50);

        // Grid lines
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        const gridSteps = 4;
        for (let i = 0; i <= gridSteps; i++) {
            const y = padding.top + (chartH / gridSteps) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(w - padding.right, y);
            ctx.stroke();

            // Y-axis labels
            const val = Math.round(maxPower - (maxPower - minPower) * (i / gridSteps));
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '10px "JetBrains Mono"';
            ctx.textAlign = 'right';
            ctx.fillText(`${val}W`, padding.left - 8, y + 4);
        }

        // Time axis (every 60s)
        if (visibleSamples.length > 1) {
            ctx.fillStyle = 'rgba(255,255,255,0.25)';
            ctx.font = '10px "JetBrains Mono"';
            ctx.textAlign = 'center';
            const firstTime = visibleSamples[0].time;
            const lastTime = visibleSamples[visibleSamples.length - 1].time;
            const timeRange = lastTime - firstTime || 1;
            for (let t = Math.ceil(firstTime / 60) * 60; t <= lastTime; t += 60) {
                const x = padding.left + ((t - firstTime) / timeRange) * chartW;
                const mins = Math.floor(t / 60);
                ctx.fillText(`${mins}m`, x, h - 6);
            }
        }

        // Power area fill (gradient)
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, 'rgba(0, 194, 255, 0.25)');
        gradient.addColorStop(0.5, 'rgba(0, 194, 255, 0.08)');
        gradient.addColorStop(1, 'rgba(0, 194, 255, 0)');

        ctx.beginPath();
        visibleSamples.forEach((sample, i) => {
            const x = padding.left + (i / (visibleSamples.length - 1)) * chartW;
            const y = padding.top + chartH - ((sample.power - minPower) / (maxPower - minPower)) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        // Close path for fill
        const lastX = padding.left + chartW;
        ctx.lineTo(lastX, padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        // Power line
        ctx.beginPath();
        visibleSamples.forEach((sample, i) => {
            const x = padding.left + (i / (visibleSamples.length - 1)) * chartW;
            const y = padding.top + chartH - ((sample.power - minPower) / (maxPower - minPower)) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = 'rgba(0, 194, 255, 0.9)';
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';
        ctx.stroke();

        // Current power glow dot
        if (visibleSamples.length > 0) {
            const last = visibleSamples[visibleSamples.length - 1];
            const x = padding.left + chartW;
            const y = padding.top + chartH - ((last.power - minPower) / (maxPower - minPower)) * chartH;

            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 194, 255, 1)';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(0, 194, 255, 0.3)';
            ctx.fill();
        }

    }, [samples, maxSamples]);

    return (
        <div className="power-graph">
            <div className="power-graph-header">
                <span className="power-graph-title">⚡ POWER</span>
                {samples.length > 0 && (
                    <span className="power-graph-current">
                        {samples[samples.length - 1].power}W
                    </span>
                )}
            </div>
            <canvas ref={canvasRef} className="power-canvas" />
        </div>
    );
};
