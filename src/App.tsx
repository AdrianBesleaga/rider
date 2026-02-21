import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppProvider';
import { LandingPageWrapper } from './pages/LandingPageWrapper';
import { RidePage } from './pages/RidePage';
import { SummaryPage } from './pages/SummaryPage';

export const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AppProvider>
                <Routes>
                    <Route path="/" element={<LandingPageWrapper />} />
                    <Route path="/ride" element={<RidePage />} />
                    <Route path="/summary" element={<SummaryPage />} />
                </Routes>
            </AppProvider>
        </BrowserRouter>
    );
};
