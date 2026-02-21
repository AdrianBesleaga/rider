/**
 * World Explorer — Route Engine & City Data
 *
 * Uses free open-source APIs:
 * - OSRM (routing)
 * - Open-Elevation (elevation profiles)
 * - Nominatim (reverse geocoding)
 * - Wikipedia REST API (city facts)
 */

import { RoutePoint, WorldRoute } from '../types';

// ─── Curated Starting Locations ───

interface StartLocation {
    name: string;
    country: string;
    lat: number;
    lng: number;
}

const LOCATIONS: StartLocation[] = [
    // Europe
    { name: 'Paris', country: 'France', lat: 48.8566, lng: 2.3522 },
    { name: 'Rome', country: 'Italy', lat: 41.9028, lng: 12.4964 },
    { name: 'Barcelona', country: 'Spain', lat: 41.3874, lng: 2.1686 },
    { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
    { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
    { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
    { name: 'Vienna', country: 'Austria', lat: 48.2082, lng: 16.3738 },
    { name: 'Prague', country: 'Czech Republic', lat: 50.0755, lng: 14.4378 },
    { name: 'Lisbon', country: 'Portugal', lat: 38.7223, lng: -9.1393 },
    { name: 'Copenhagen', country: 'Denmark', lat: 55.6761, lng: 12.5683 },
    // Asia
    { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
    { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
    { name: 'Bangkok', country: 'Thailand', lat: 13.7563, lng: 100.5018 },
    { name: 'Seoul', country: 'South Korea', lat: 37.5665, lng: 126.9780 },
    { name: 'Dubai', country: 'UAE', lat: 25.2048, lng: 55.2708 },
    // Americas
    { name: 'New York', country: 'USA', lat: 40.7128, lng: -74.0060 },
    { name: 'San Francisco', country: 'USA', lat: 37.7749, lng: -122.4194 },
    { name: 'Buenos Aires', country: 'Argentina', lat: -34.6037, lng: -58.3816 },
    { name: 'Rio de Janeiro', country: 'Brazil', lat: -22.9068, lng: -43.1729 },
    { name: 'Vancouver', country: 'Canada', lat: 49.2827, lng: -123.1207 },
    { name: 'Mexico City', country: 'Mexico', lat: 19.4326, lng: -99.1332 },
    // Africa & Oceania
    { name: 'Cape Town', country: 'South Africa', lat: -33.9249, lng: 18.4241 },
    { name: 'Marrakech', country: 'Morocco', lat: 31.6295, lng: -7.9811 },
    { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
    { name: 'Auckland', country: 'New Zealand', lat: -36.8485, lng: 174.7633 },
    // Mountain / Scenic
    { name: 'Interlaken', country: 'Switzerland', lat: 46.6863, lng: 7.8632 },
    { name: 'Reykjavik', country: 'Iceland', lat: 64.1466, lng: -21.9426 },
    { name: 'Queenstown', country: 'New Zealand', lat: -45.0312, lng: 168.6626 },
    { name: 'Kyoto', country: 'Japan', lat: 35.0116, lng: 135.7681 },
];

// ─── Public API ───

/**
 * Pick a random starting location.
 */
export function getRandomLocation(): StartLocation {
    return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
}

/**
 * Fetch a cycling route from a starting point using OSRM.
 * Generates a round-ish route by creating waypoints around the start.
 */
export async function fetchRoute(start: StartLocation): Promise<WorldRoute> {
    // Generate 3 waypoints in a rough loop (~5-10km out)
    const offsetKm = 3 + Math.random() * 5; // 3-8km
    const offsetDeg = offsetKm / 111; // rough km→degree
    const angle1 = Math.random() * Math.PI * 2;
    const angle2 = angle1 + (Math.PI * 0.6) + Math.random() * 0.5;
    const angle3 = angle2 + (Math.PI * 0.6) + Math.random() * 0.5;

    const waypoints = [
        [start.lng, start.lat],
        [start.lng + Math.cos(angle1) * offsetDeg, start.lat + Math.sin(angle1) * offsetDeg],
        [start.lng + Math.cos(angle2) * offsetDeg, start.lat + Math.sin(angle2) * offsetDeg],
        [start.lng + Math.cos(angle3) * offsetDeg, start.lat + Math.sin(angle3) * offsetDeg],
        [start.lng, start.lat], // return to start
    ];

    const coords = waypoints.map(w => `${w[0]},${w[1]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/cycling/${coords}?overview=full&geometries=geojson`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes?.[0]) {
            console.warn('[WorldRoute] OSRM returned no route, using fallback');
            return createFallbackRoute(start);
        }

        const geojson = data.routes[0].geometry.coordinates as [number, number][];
        const totalDistance = data.routes[0].distance as number;

        // Sample points (max 100 to keep API calls reasonable)
        const step = Math.max(1, Math.floor(geojson.length / 100));
        const sampled = geojson.filter((_, i) => i % step === 0);

        // Fetch elevation for sampled points
        const points = await fetchElevation(sampled.map(c => ({ lat: c[1], lng: c[0] })));

        return {
            name: start.name,
            country: start.country,
            points,
            totalDistance,
        };
    } catch (e) {
        console.warn('[WorldRoute] Route fetch failed, using fallback:', e);
        return createFallbackRoute(start);
    }
}

/**
 * Create a simple straight-line fallback route when APIs are unavailable.
 */
function createFallbackRoute(start: StartLocation): WorldRoute {
    const points: RoutePoint[] = [];
    const numPoints = 50;
    const direction = Math.random() * Math.PI * 2;

    for (let i = 0; i < numPoints; i++) {
        const dist = (i / numPoints) * 0.05; // ~5km total
        points.push({
            lat: start.lat + Math.sin(direction) * dist + (Math.random() - 0.5) * 0.002,
            lng: start.lng + Math.cos(direction) * dist + (Math.random() - 0.5) * 0.002,
            elevation: 50 + Math.sin(i * 0.3) * 30 + Math.random() * 10,
        });
    }

    return {
        name: start.name,
        country: start.country,
        points,
        totalDistance: 5000,
    };
}

// ─── Elevation API ───

async function fetchElevation(coords: { lat: number; lng: number }[]): Promise<RoutePoint[]> {
    try {
        const locations = coords.map(c => `${c.lat},${c.lng}`).join('|');
        const res = await fetch(`https://api.open-elevation.com/api/v1/lookup?locations=${locations}`);
        const data = await res.json();

        if (data.results) {
            return data.results.map((r: { latitude: number; longitude: number; elevation: number }) => ({
                lat: r.latitude,
                lng: r.longitude,
                elevation: r.elevation,
            }));
        }
    } catch (e) {
        console.warn('[WorldRoute] Elevation API failed, using synthetic:', e);
    }

    // Fallback: synthetic elevation
    return coords.map((c, i) => ({
        ...c,
        elevation: 50 + Math.sin(i * 0.15) * 40 + Math.random() * 15,
    }));
}

// ─── Route Position Helpers ───

/**
 * Calculate bearing between two points (used for map rotation).
 */
export function bearing(p1: RoutePoint, p2: RoutePoint): number {
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const lat1 = p1.lat * Math.PI / 180;
    const lat2 = p2.lat * Math.PI / 180;
    const y = Math.sin(dLng) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
    return Math.atan2(y, x) * 180 / Math.PI;
}

/**
 * Haversine distance between two points in meters.
 */
export function haversine(p1: { lat: number; lng: number }, p2: { lat: number; lng: number }): number {
    const R = 6371000;
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2
        + Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * Calculate grade (%) between two consecutive route points.
 */
export function gradeAtIndex(points: RoutePoint[], index: number): number {
    if (index <= 0 || index >= points.length) return 0;
    const prev = points[index - 1];
    const curr = points[index];
    const dist = haversine(prev, curr);
    if (dist < 1) return 0;
    const rise = curr.elevation - prev.elevation;
    return Math.max(-40, Math.min(40, (rise / dist) * 100));
}

/**
 * Interpolate position along route based on cumulative distance traveled.
 * Returns { index, lat, lng, elevation, progress (0-1) }.
 */
export function interpolatePosition(
    points: RoutePoint[],
    distanceTraveled: number,
): { index: number; lat: number; lng: number; elevation: number; progress: number } {
    if (points.length < 2) {
        return { index: 0, lat: points[0].lat, lng: points[0].lng, elevation: points[0].elevation, progress: 0 };
    }

    let cumDist = 0;
    for (let i = 1; i < points.length; i++) {
        const segDist = haversine(points[i - 1], points[i]);
        if (cumDist + segDist >= distanceTraveled) {
            const t = segDist > 0 ? (distanceTraveled - cumDist) / segDist : 0;
            return {
                index: i,
                lat: points[i - 1].lat + (points[i].lat - points[i - 1].lat) * t,
                lng: points[i - 1].lng + (points[i].lng - points[i - 1].lng) * t,
                elevation: points[i - 1].elevation + (points[i].elevation - points[i - 1].elevation) * t,
                progress: distanceTraveled / totalRouteDistance(points),
            };
        }
        cumDist += segDist;
    }

    // Past the end — return final point
    const last = points[points.length - 1];
    return { index: points.length - 1, lat: last.lat, lng: last.lng, elevation: last.elevation, progress: 1 };
}

function totalRouteDistance(points: RoutePoint[]): number {
    let d = 0;
    for (let i = 1; i < points.length; i++) {
        d += haversine(points[i - 1], points[i]);
    }
    return d || 1;
}
