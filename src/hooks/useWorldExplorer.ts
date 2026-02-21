import { useState, useEffect, useRef, MutableRefObject } from 'react';
import { WorldRoute, CyclingData } from '../types';
import { WebLLMService } from '../services/webLLMService';
import { getRandomLocation, fetchRoute, interpolatePosition, gradeAtIndex } from '../services/worldRoutes';

export interface RiderPosition {
    index: number;
    lat: number;
    lng: number;
    elevation: number;
    progress: number;
}

interface UseWorldExplorerOptions {
    active: boolean;
    cyclingData: CyclingData;
    aiServiceRef: MutableRefObject<WebLLMService | null>;
}

/**
 * Manages world exploration: route loading, rider position advancement,
 * Wikipedia context fetching, and AI fact generation.
 */
export function useWorldExplorer({ active, cyclingData, aiServiceRef }: UseWorldExplorerOptions) {
    const [worldRoute, setWorldRoute] = useState<WorldRoute | null>(null);
    const [explorerDist, setExplorerDist] = useState(0);
    const [riderPos, setRiderPos] = useState<RiderPosition>({ index: 0, lat: 0, lng: 0, elevation: 0, progress: 0 });
    const [speedMultiplier, setSpeedMultiplier] = useState(1);
    const [currentGrade, setCurrentGrade] = useState(0);

    // AI facts state
    const [factIndex, setFactIndex] = useState(0);
    const [aiFacts, setAiFacts] = useState<string[]>([]);
    const [wikiSummary, setWikiSummary] = useState('');

    // Virtual gear: 1 (easiest) to 12 (hardest)
    const [virtualGear, setVirtualGear] = useState(6);

    // ─── Load route on ride start ───
    useEffect(() => {
        if (!active || worldRoute) return;

        const loc = getRandomLocation();
        console.log(`[Explorer] Starting route in ${loc.name}, ${loc.country}`);
        setRiderPos({ index: 0, lat: loc.lat, lng: loc.lng, elevation: 0, progress: 0 });

        fetchRoute(loc).then(route => {
            setWorldRoute(route);
            setExplorerDist(0);
            console.log(`[Explorer] Route loaded: ${route.points.length} points, ${(route.totalDistance / 1000).toFixed(1)}km`);
        }).catch(err => {
            console.warn('[Explorer] Route fetch failed:', err);
        });
    }, [active]);

    // ─── Advance rider position with requestAnimationFrame (smooth 60fps) ───
    const distRef = useRef(0);
    useEffect(() => {
        if (!active || !worldRoute) return;

        let lastTime = performance.now();
        let lastGradeTime = 0;
        let rafId: number;

        const tick = (now: number) => {
            const dt = Math.min((now - lastTime) / 1000, 0.5); // delta in seconds, cap at 0.5s
            lastTime = now;

            const effectiveSpeed = Math.max(cyclingData.speed, 5); // min 5 km/h
            const advance = (effectiveSpeed / 3.6) * speedMultiplier * dt;
            const totalDist = worldRoute.totalDistance || 1;
            distRef.current = (distRef.current + advance) % totalDist;

            const pos = interpolatePosition(worldRoute.points, distRef.current);
            setRiderPos(pos);
            setExplorerDist(distRef.current);

            // Update grade for display (once per second)
            if (now - lastGradeTime > 1000) {
                lastGradeTime = now;
                const grade = gradeAtIndex(worldRoute.points, pos.index);
                setCurrentGrade(grade);
            }

            rafId = requestAnimationFrame(tick);
        };

        rafId = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(rafId);
    }, [active, worldRoute, cyclingData.speed, speedMultiplier]);

    // ─── Fetch Wikipedia summary for current city ───
    useEffect(() => {
        if (!active || !worldRoute) return;
        const fetchWiki = async () => {
            try {
                const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(worldRoute.name)}`;
                const res = await fetch(url);
                if (res.ok) {
                    const data = await res.json();
                    setWikiSummary(data.extract || '');
                }
            } catch { /* non-critical */ }
        };
        fetchWiki();
        setAiFacts([]);
        setFactIndex(0);
    }, [active, worldRoute]);

    // ─── Generate AI facts every 10 seconds ───
    useEffect(() => {
        if (!active || !worldRoute || !wikiSummary) return;

        const generate = async () => {
            try {
                const ai = aiServiceRef.current;
                if (!ai || !ai.isAvailable()) {
                    setFactIndex(i => i + 1);
                    return;
                }

                const fact = await ai.generateCityFact(
                    `${worldRoute.name}, ${worldRoute.country}`,
                    wikiSummary,
                );
                if (fact) {
                    setAiFacts(prev => {
                        const next = [...prev, fact];
                        setFactIndex(next.length - 1);
                        return next;
                    });
                }
            } catch (err) {
                console.warn('[Explorer] Fact generation error (non-fatal):', err);
            }
        };

        generate();
        const timer = setInterval(generate, 60000);
        return () => clearInterval(timer);
    }, [active, worldRoute, wikiSummary]);

    // Build facts list: AI facts first, Wikipedia fallback
    const wikiSentences = wikiSummary
        ? wikiSummary.split('. ').filter(s => s.length > 15).map(s => s.endsWith('.') ? s : s + '.')
        : [];
    const facts = aiFacts.length > 0 ? aiFacts : wikiSentences;
    const isAIFacts = aiFacts.length > 0;
    // For AI facts: show the latest; for wiki: rotate through
    const currentFactIndex = isAIFacts
        ? Math.min(factIndex, facts.length - 1)
        : (facts.length > 0 ? factIndex % facts.length : 0);

    const shiftUp = () => setVirtualGear(g => Math.min(12, g + 1));
    const shiftDown = () => setVirtualGear(g => Math.max(1, g - 1));

    const reset = () => {
        setWorldRoute(null);
        setExplorerDist(0);
        setAiFacts([]);
        setWikiSummary('');
        setFactIndex(0);
    };

    return {
        worldRoute,
        riderPos,
        currentGrade,
        virtualGear,
        shiftUp,
        shiftDown,
        speedMultiplier,
        setSpeedMultiplier,
        facts,
        currentFactIndex,
        isAIFacts,
        reset,
    };
}
