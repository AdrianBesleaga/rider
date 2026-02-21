import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppProvider';
import { SessionSummary } from '../components/SessionSummary';

export const SummaryPage: React.FC = () => {
    const navigate = useNavigate();
    const { cyclingData, newsConsumed, handleNewRide, session } = useAppContext();

    return (
        <SessionSummary
            data={cyclingData}
            newsConsumed={newsConsumed}
            onNewRide={handleNewRide}
            onGoHome={() => {
                session.resetSession();
                navigate('/');
            }}
            onExportStrava={session.exportStrava}
        />
    );
};
