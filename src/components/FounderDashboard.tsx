import React from 'react';
import './FounderDashboard.css';

interface FounderDashboardProps {
    companyName: string;
    metrics: string[];
}

/**
 * Founder Mode — displays company metrics during a ride.
 * Values are placeholder/mock since real integrations (Stripe, analytics)
 * would require backend APIs. The structure is ready for real data.
 */

const MOCK_VALUES: Record<string, string> = {
    MRR: '$12.4K',
    ARR: '$148.8K',
    DAU: '1,247',
    MAU: '8,932',
    Churn: '2.1%',
    NPS: '72',
    'Burn Rate': '$18K/mo',
    Runway: '14 months',
    Users: '3,421',
    Revenue: '$42.1K',
    CAC: '$28',
    LTV: '$340',
};

export const FounderDashboard: React.FC<FounderDashboardProps> = ({
    companyName,
    metrics,
}) => {
    return (
        <div className="founder-dashboard">
            <div className="founder-header">
                <span className="founder-icon">🚀</span>
                <span className="founder-company">{companyName || 'My Company'}</span>
                <span className="founder-badge">FOUNDER MODE</span>
            </div>

            <div className="founder-metrics-grid">
                {metrics.length === 0 ? (
                    <div className="founder-empty">
                        Add metrics in Settings → Founder Mode
                    </div>
                ) : (
                    metrics.map((metric) => (
                        <div key={metric} className="founder-metric-card">
                            <span className="founder-metric-label">{metric}</span>
                            <span className="founder-metric-value">
                                {MOCK_VALUES[metric] || '—'}
                            </span>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};
