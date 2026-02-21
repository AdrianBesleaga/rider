import React, { useState, useEffect, useCallback } from 'react';
import { getNextMessage, resetMessageQueue } from '../services/rideMessages';
import type { RideStyle } from '../types';
import './MotivationalBanner.css';

interface MotivationalBannerProps {
    rideStyle: RideStyle;
    /** Interval in seconds between messages (default: 20) */
    interval?: number;
}

export const MotivationalBanner: React.FC<MotivationalBannerProps> = ({
    rideStyle,
    interval = 20,
}) => {
    const [message, setMessage] = useState('');
    const [visible, setVisible] = useState(false);

    const showNext = useCallback(() => {
        // Fade out
        setVisible(false);

        // After fade-out, swap text and fade in
        setTimeout(() => {
            setMessage(getNextMessage(rideStyle));
            setVisible(true);
        }, 600); // matches CSS transition duration
    }, [rideStyle]);

    // Reset queue when ride style changes
    useEffect(() => {
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
        </div>
    );
};
