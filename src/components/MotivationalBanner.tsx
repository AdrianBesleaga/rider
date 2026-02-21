import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getNextMessage, resetMessageQueue } from '../services/rideMessages';
import { WebLLMService } from '../services/webLLMService';
import type { RideStyle, CyclingData } from '../types';
import './MotivationalBanner.css';

interface MotivationalBannerProps {
    rideStyle: RideStyle;
    /** Interval in seconds between messages (default: 20) */
    interval?: number;
    /** Live cycling data — when provided with an AI service, enables AI-generated messages */
    cyclingData?: CyclingData;
    /** Optional WebLLM service instance for AI coaching */
    aiService?: WebLLMService | null;
}

export const MotivationalBanner: React.FC<MotivationalBannerProps> = ({
    rideStyle,
    interval = 20,
    cyclingData,
    aiService,
}) => {
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);
    const dataRef = useRef(cyclingData);

    // Keep data ref fresh without re-triggering effects
    useEffect(() => {
        dataRef.current = cyclingData;
    }, [cyclingData]);

    const showNext = useCallback(async () => {
        // Fade out
        setVisible(false);

        // After fade-out, get new message and fade in
        setTimeout(async () => {
            let nextMsg: string | null = null;

            // Try AI generation first
            if (aiService?.isAvailable() && dataRef.current) {
                nextMsg = await aiService.generateMessage(dataRef.current, rideStyle);
            }

            // Fallback to static queue
            if (!nextMsg) {
                nextMsg = getNextMessage(rideStyle);
                console.log('[Banner] Static fallback:', nextMsg.substring(0, 60));
            } else {
                console.log('[Banner] AI message:', nextMsg.substring(0, 60));
            }

            setMessage(nextMsg);
            setVisible(true);
        }, 600);
    }, [rideStyle, aiService]);

    // Reset queue when ride style changes
    useEffect(() => {
        console.log('[Banner] Ride style changed to:', rideStyle);
        resetMessageQueue();
        setMessage(getNextMessage(rideStyle));
        setVisible(true);
    }, [rideStyle]);

    // Auto-rotate messages
    useEffect(() => {
        const timer = setInterval(showNext, interval * 1000);
        return () => clearInterval(timer);
    }, [showNext, interval]);

    return (
        <div className={`moti-banner ${visible ? 'moti-visible' : 'moti-hidden'}`}>
            <span className="moti-text">{message}</span>
            {aiService && (
                <span className={`moti-ai-badge ${aiService.isAvailable() ? 'moti-ai-ready' : 'moti-ai-loading'}`}>
                    {aiService.isAvailable()
                        ? '🧠 AI'
                        : aiService.status === 'loading'
                            ? `🧠 Loading ${aiService.progress}%`
                            : null
                    }
                </span>
            )}
        </div>
    );
};
