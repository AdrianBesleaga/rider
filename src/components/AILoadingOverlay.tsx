import React from 'react';
import type { WebLLMProgress } from '../services/webLLMService';
import './AILoadingOverlay.css';

interface AILoadingOverlayProps {
    progress: WebLLMProgress;
}

export const AILoadingOverlay: React.FC<AILoadingOverlayProps> = ({ progress }) => {
    if (progress.status !== 'loading') return null;

    return (
        <div className="ai-loading">
            <div className="ai-loading-card">
                <div className="ai-loading-icon">🧠</div>
                <div className="ai-loading-title">Loading AI Coach</div>
                <div className="ai-loading-bar-track">
                    <div
                        className="ai-loading-bar-fill"
                        style={{ width: `${progress.progress}%` }}
                    />
                </div>
                <div className="ai-loading-text">{progress.message}</div>
                <div className="ai-loading-hint">
                    First download: ~800 MB · Cached for future rides
                </div>
            </div>
        </div>
    );
};
