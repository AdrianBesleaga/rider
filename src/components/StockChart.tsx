import React, { useRef, useEffect } from 'react';
import { StockQuote } from '../types';
import './StockChart.css';

interface Props {
    stocks: StockQuote[];
    selectedSymbol: string;
    onSelect: (symbol: string) => void;
}

function drawChart(canvas: HTMLCanvasElement, data: { time: string; value: number }[], isPositive: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx || data.length < 2) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const pad = { top: 10, right: 10, bottom: 5, left: 10 };
    const chartW = w - pad.left - pad.right;
    const chartH = h - pad.top - pad.bottom;

    const values = data.map(d => d.value);
    const min = Math.min(...values) * 0.998;
    const max = Math.max(...values) * 1.002;
    const range = max - min || 1;

    ctx.clearRect(0, 0, w, h);

    const color = isPositive ? '0, 230, 118' : '255, 82, 82';

    // Area fill
    const gradient = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    gradient.addColorStop(0, `rgba(${color}, 0.2)`);
    gradient.addColorStop(1, `rgba(${color}, 0)`);

    ctx.beginPath();
    data.forEach((d, i) => {
        const x = pad.left + (i / (data.length - 1)) * chartW;
        const y = pad.top + chartH - ((d.value - min) / range) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.lineTo(pad.left + chartW, pad.top + chartH);
    ctx.lineTo(pad.left, pad.top + chartH);
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((d, i) => {
        const x = pad.left + (i / (data.length - 1)) * chartW;
        const y = pad.top + chartH - ((d.value - min) / range) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = `rgba(${color}, 0.9)`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
}

export const StockChart: React.FC<Props> = ({ stocks, selectedSymbol, onSelect }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const selected = stocks.find(s => s.symbol === selectedSymbol) || stocks[0];

    useEffect(() => {
        if (!canvasRef.current || !selected) return;
        drawChart(canvasRef.current, selected.data, selected.change >= 0);
    }, [selected]);

    return (
        <div className="stock-chart-panel">
            <div className="stock-tabs">
                {stocks.map(stock => (
                    <button
                        key={stock.symbol}
                        className={`stock-tab ${stock.symbol === selectedSymbol ? 'active' : ''}`}
                        onClick={() => onSelect(stock.symbol)}
                    >
                        <span className="stock-tab-symbol">{stock.symbol}</span>
                        <span className={`stock-tab-change ${stock.change >= 0 ? 'gain' : 'loss'}`}>
                            {stock.change >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                        </span>
                    </button>
                ))}
            </div>

            {selected && (
                <div className="stock-detail">
                    <div className="stock-info">
                        <div className="stock-name">{selected.name}</div>
                        <div className="stock-price-row">
                            <span className="stock-price">
                                ${selected.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                            <span className={`stock-change-badge ${selected.change >= 0 ? 'gain' : 'loss'}`}>
                                {selected.change >= 0 ? '▲' : '▼'} ${Math.abs(selected.change).toFixed(2)} ({Math.abs(selected.changePercent).toFixed(2)}%)
                            </span>
                        </div>
                        <div className="stock-meta">
                            <span>Vol: {(selected.volume / 1_000_000).toFixed(1)}M</span>
                            <span>H: ${selected.high.toFixed(2)}</span>
                            <span>L: ${selected.low.toFixed(2)}</span>
                        </div>
                    </div>
                    <canvas ref={canvasRef} className="stock-canvas" />
                </div>
            )}
        </div>
    );
};
