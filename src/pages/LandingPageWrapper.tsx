import React from 'react';
import { useAppContext } from '../context/AppProvider';
import { LandingPage } from '../components/LandingPage';

export const LandingPageWrapper: React.FC = () => {
    const { startRide, setSettings } = useAppContext();

    return (
        <LandingPage
            onStartRide={() => startRide(false)}
            onStartDemo={() => {
                setSettings(s => ({ ...s, useMockData: true, useMockBle: true }));
                startRide(true);
            }}
        />
    );
};
