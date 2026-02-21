import React, { useState } from 'react';
import './LandingPage.css';

interface LandingPageProps {
    onStartRide: () => void;
    onStartDemo: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStartRide, onStartDemo }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleWaitlist = (e: React.FormEvent) => {
        e.preventDefault();
        if (email) {
            // TODO: integrate with ConvertKit or Formspree
            console.log('Waitlist signup:', email);
            setSubmitted(true);
        }
    };

    return (
        <div className="landing">
            {/* Hero Section */}
            <section className="landing-hero">
                <div className="landing-hero-bg" />
                <nav className="landing-nav">
                    <div className="landing-brand">
                        <span className="landing-brand-icon">🚴</span>
                        <span className="landing-brand-name">STOCK RIDER</span>
                    </div>
                    <div className="landing-nav-links">
                        <a href="#features">Features</a>
                        <a href="#how">How It Works</a>
                        <a href="#pricing">Pricing</a>
                    </div>
                </nav>

                <div className="landing-hero-content">
                    <div className="landing-hero-badge">🧠 EXERCISE BODY + MIND</div>
                    <h1 className="landing-hero-title">
                        Ride Smart.<br />
                        <span className="landing-hero-accent">Learn While You Burn.</span>
                    </h1>
                    <p className="landing-hero-subtitle">
                        The indoor cycling app for founders and busy professionals.
                        Consume live market data, AI news, and tech insights while
                        you train — because your time is too valuable for just pedaling.
                    </p>
                    <div className="landing-hero-actions">
                        <button className="landing-btn-primary" onClick={onStartRide}>
                            <span>🔗</span> Connect Trainer & Ride
                        </button>
                        <button className="landing-btn-secondary" onClick={onStartDemo}>
                            <span>🌐</span> Try Demo Mode
                        </button>
                    </div>
                </div>

                <div className="landing-hero-stats">
                    <div className="landing-stat">
                        <span className="landing-stat-value">0</span>
                        <span className="landing-stat-label">Hours "Wasted"</span>
                    </div>
                    <div className="landing-stat">
                        <span className="landing-stat-value">∞</span>
                        <span className="landing-stat-label">Knowledge Gained</span>
                    </div>
                    <div className="landing-stat">
                        <span className="landing-stat-value">100%</span>
                        <span className="landing-stat-label">Guilt-Free</span>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="landing-features" id="features">
                <h2 className="landing-section-title">Why Stock Rider?</h2>
                <div className="landing-features-grid">
                    <div className="landing-feature-card">
                        <div className="landing-feature-icon">📈</div>
                        <h3>Live Market Data</h3>
                        <p>Watch crypto, stocks, and financial markets update in real-time as you ride through a cyberpunk 3D world.</p>
                    </div>
                    <div className="landing-feature-card">
                        <div className="landing-feature-icon">📰</div>
                        <h3>Tech & AI News</h3>
                        <p>Auto-curated feeds from TechCrunch, Ars Technica, CoinDesk — summarized into ride-friendly chunks.</p>
                    </div>
                    <div className="landing-feature-card">
                        <div className="landing-feature-icon">🚀</div>
                        <h3>Startup Spotlight</h3>
                        <p>Discover trending startups, funding rounds, and YC batches while burning calories.</p>
                    </div>
                    <div className="landing-feature-card">
                        <div className="landing-feature-icon">🎥</div>
                        <h3>Content Creator Mode</h3>
                        <p>OBS overlay support — record yourself cycling through data for a unique YouTube format.</p>
                    </div>
                    <div className="landing-feature-card">
                        <div className="landing-feature-icon">🔗</div>
                        <h3>Any FTMS Trainer</h3>
                        <p>Works with Wahoo KICKR, Tacx, Elite, and any Bluetooth FTMS-compatible smart trainer via Web Bluetooth.</p>
                    </div>
                    <div className="landing-feature-card">
                        <div className="landing-feature-icon">📊</div>
                        <h3>Session Summary</h3>
                        <p>Every ride generates a shareable card: watts, calories, distance + what you learned. Post it on X.</p>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="landing-how" id="how">
                <h2 className="landing-section-title">How It Works</h2>
                <div className="landing-steps">
                    <div className="landing-step">
                        <div className="landing-step-number">1</div>
                        <h3>Connect Your Trainer</h3>
                        <p>Pair your smart trainer via Bluetooth — no app install needed, just open Chrome.</p>
                    </div>
                    <div className="landing-step-arrow">→</div>
                    <div className="landing-step">
                        <div className="landing-step-number">2</div>
                        <h3>Choose Your Content</h3>
                        <p>Pick from markets, tech news, AI updates, or let the algorithm curate your feed.</p>
                    </div>
                    <div className="landing-step-arrow">→</div>
                    <div className="landing-step">
                        <div className="landing-step-number">3</div>
                        <h3>Ride & Learn</h3>
                        <p>Data billboards appear along your cyberpunk road. Pedal through knowledge.</p>
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section className="landing-pricing" id="pricing">
                <h2 className="landing-section-title">Simple Pricing</h2>
                <div className="landing-pricing-grid">
                    <div className="landing-price-card">
                        <div className="landing-price-tier">Free</div>
                        <div className="landing-price-amount">$0</div>
                        <div className="landing-price-period">forever</div>
                        <ul className="landing-price-features">
                            <li>✓ 3D cyberpunk ride scene</li>
                            <li>✓ Basic cycling metrics</li>
                            <li>✓ 2 data feeds (crypto + news)</li>
                            <li>✓ Session summary</li>
                            <li className="landing-price-disabled">✗ All data feeds</li>
                            <li className="landing-price-disabled">✗ OBS overlay</li>
                            <li className="landing-price-disabled">✗ AI curation</li>
                        </ul>
                        <button className="landing-btn-outline" onClick={onStartDemo}>
                            Start Free
                        </button>
                    </div>
                    <div className="landing-price-card landing-price-featured">
                        <div className="landing-price-badge">BEST VALUE</div>
                        <div className="landing-price-tier">Pro</div>
                        <div className="landing-price-amount">$7.99</div>
                        <div className="landing-price-period">/ month</div>
                        <ul className="landing-price-features">
                            <li>✓ Everything in Free</li>
                            <li>✓ All data feeds & custom RSS</li>
                            <li>✓ OBS overlay mode</li>
                            <li>✓ AI-curated content</li>
                            <li>✓ Ride analytics & history</li>
                            <li>✓ Strava sync</li>
                            <li>✓ Priority support</li>
                        </ul>
                        <button className="landing-btn-primary" onClick={onStartRide}>
                            Start Pro Trial
                        </button>
                    </div>
                </div>
            </section>

            {/* Waitlist / CTA */}
            <section className="landing-cta">
                <h2>Join the Ride</h2>
                <p>Be the first to know when new features drop. No spam, just gains.</p>
                {submitted ? (
                    <div className="landing-cta-success">
                        <span>🎉</span> You're in! We'll keep you posted.
                    </div>
                ) : (
                    <form className="landing-cta-form" onSubmit={handleWaitlist}>
                        <input
                            type="email"
                            placeholder="your@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="landing-cta-input"
                        />
                        <button type="submit" className="landing-btn-primary">
                            Join Waitlist
                        </button>
                    </form>
                )}
            </section>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="landing-footer-brand">
                    🚴 Stock Rider — by <a href="https://piwi.ai" target="_blank" rel="noopener">piwi.ai</a>
                </div>
                <div className="landing-footer-links">
                    <a href="https://github.com/AdrianBesleaga/stock-rider" target="_blank" rel="noopener">GitHub</a>
                    <span>·</span>
                    <a href="#">Privacy</a>
                    <span>·</span>
                    <a href="#">Terms</a>
                </div>
            </footer>
        </div>
    );
};
