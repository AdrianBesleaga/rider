import React from 'react';
import { NewsItem } from '../types';
import './NewsFeed.css';

interface Props {
    items: NewsItem[];
}

const CATEGORY_COLORS: Record<string, string> = {
    tech: '#60a5fa',
    ai: '#c084fc',
    crypto: '#fbbf24',
    startup: '#34d399',
};

const CATEGORY_ICONS: Record<string, string> = {
    tech: '💻',
    ai: '🤖',
    crypto: '₿',
    startup: '🚀',
};

export const NewsFeed: React.FC<Props> = ({ items }) => {
    return (
        <div className="news-feed">
            <div className="news-header">
                <span className="news-title">📰 LIVE FEED</span>
                <span className="news-count">{items.length} stories</span>
            </div>
            <div className="news-list">
                {items.map(item => (
                    <article key={item.id} className="news-item">
                        <div className="news-item-header">
                            <span
                                className="news-category"
                                style={{ background: CATEGORY_COLORS[item.category] + '22', color: CATEGORY_COLORS[item.category] }}
                            >
                                {CATEGORY_ICONS[item.category]} {item.category.toUpperCase()}
                            </span>
                            <span className="news-time">{item.publishedAt}</span>
                        </div>
                        <h3 className="news-item-title">{item.title}</h3>
                        <p className="news-summary">{item.summary}</p>
                        <div className="news-source">{item.source}</div>
                    </article>
                ))}
            </div>
        </div>
    );
};
