import React from 'react';
import { CryptoTicker as CryptoTickerType } from '../types';
import './CryptoTicker.css';

interface Props {
    tickers: CryptoTickerType[];
}

function MiniSparkline({ data, isPositive }: { data: number[]; isPositive: boolean }) {
    if (data.length < 2) return null;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const width = 60;
    const height = 20;

    const points = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((v - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="sparkline">
            <polyline
                points={points}
                fill="none"
                stroke={isPositive ? 'var(--color-gain)' : 'var(--color-loss)'}
                strokeWidth="1.5"
            />
        </svg>
    );
}

export const CryptoTickerBar: React.FC<Props> = ({ tickers }) => {
    return (
        <div className="crypto-ticker-bar">
            <div className="ticker-track">
                {[...tickers, ...tickers].map((coin, i) => (
                    <div key={`${coin.id}-${i}`} className="ticker-item">
                        <span className="ticker-symbol">{coin.symbol}</span>
                        <MiniSparkline data={coin.sparkline} isPositive={coin.change24h >= 0} />
                        <span className="ticker-price">
                            ${coin.price >= 1 ? coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : coin.price.toFixed(4)}
                        </span>
                        <span className={`ticker-change ${coin.change24h >= 0 ? 'gain' : 'loss'}`}>
                            {coin.change24h >= 0 ? '▲' : '▼'} {Math.abs(coin.change24h).toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};
