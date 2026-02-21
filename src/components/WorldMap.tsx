import React, { useEffect, useRef, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './WorldMap.css';
import { RoutePoint, WorldRoute } from '../types';
import { gradeAtIndex } from '../services/worldRoutes';

// ─── ESRI Satellite tiles (free, no API key) ───
const TILE_URL = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const TILE_ATTR = '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics';

interface WorldMapProps {
    route: WorldRoute | null;
    riderLat: number;
    riderLng: number;
    riderIndex: number;
    progress: number;    // 0-1
    elevation: number;   // current elevation in meters
    speed: number;       // virtual speed km/h
    multiplier: number;  // speed multiplier (e.g. 100)
}

export const WorldMap: React.FC<WorldMapProps> = ({
    route,
    riderLat,
    riderLng,
    riderIndex,
    progress,
    elevation,
    speed,
    multiplier,
}) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const leafletMap = useRef<L.Map | null>(null);
    const riderMarker = useRef<L.Marker | null>(null);
    const routeLine = useRef<L.Polyline | null>(null);
    const progressLine = useRef<L.Polyline | null>(null);
    const elevCanvas = useRef<HTMLCanvasElement>(null);

    const grade = useMemo(() => {
        if (!route) return 0;
        return gradeAtIndex(route.points, riderIndex);
    }, [route, riderIndex]);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || leafletMap.current) return;

        const map = L.map(mapRef.current, {
            center: [riderLat || 0, riderLng || 0],
            zoom: 14,
            zoomControl: false,
            attributionControl: true,
        });

        L.control.zoom({ position: 'bottomright' }).addTo(map);

        L.tileLayer(TILE_URL, {
            attribution: TILE_ATTR,
            maxZoom: 18,
        }).addTo(map);

        leafletMap.current = map;

        return () => {
            map.remove();
            leafletMap.current = null;
        };
    }, []);

    // Draw route when it changes
    useEffect(() => {
        const map = leafletMap.current;
        if (!map || !route) return;

        // Clear previous
        if (routeLine.current) map.removeLayer(routeLine.current);
        if (progressLine.current) map.removeLayer(progressLine.current);

        const coords: L.LatLngExpression[] = route.points.map(p => [p.lat, p.lng]);

        // Full route line (dim)
        routeLine.current = L.polyline(coords, {
            color: '#ffffff',
            weight: 2,
            opacity: 0.15,
        }).addTo(map);

        // Progress line (bright)
        progressLine.current = L.polyline([], {
            color: '#00ffaa',
            weight: 4,
            opacity: 1,
        }).addTo(map);

        // Fit map to route
        map.fitBounds(routeLine.current.getBounds(), { padding: [40, 40] });
    }, [route]);

    // Update rider position
    useEffect(() => {
        const map = leafletMap.current;
        if (!map) return;

        const pos: L.LatLngExpression = [riderLat, riderLng];

        // Remove old marker and recreate (ensures fresh icon)
        if (riderMarker.current) {
            map.removeLayer(riderMarker.current);
        }

        // Flip bike left/right based on travel direction (emoji faces left by default)
        const goingRight = route && riderIndex < route.points.length - 1
            && route.points[riderIndex + 1].lng > route.points[Math.max(0, riderIndex)].lng;
        const flipStyle = goingRight ? 'scaleX(-1)' : '';

        // Bike emoji marker (fixed orientation)
        const label = L.marker(pos, {
            icon: L.divIcon({
                className: 'leaflet-bike-label',
                html: `<div style="font-size:80px;margin-top:-40px;text-shadow:0 0 10px #fff,0 0 20px #00c2ff;pointer-events:none;width:100px;text-align:center;transform:${flipStyle};">🚴</div>`,
                iconSize: [100, 80],
                iconAnchor: [50, 40],
            }),
            zIndexOffset: 2000,
            interactive: false,
        }).addTo(map);

        riderMarker.current = label;

        // Update progress line (trail BEHIND the bike)
        if (route && progressLine.current) {
            const trailCoords: L.LatLngExpression[] = route.points
                .slice(0, riderIndex)
                .map(p => [p.lat, p.lng]);
            trailCoords.push([riderLat, riderLng]); // end exactly at bike
            progressLine.current.setLatLngs(trailCoords);
        }

        // Pan map to follow rider
        map.panTo(pos, { animate: true, duration: 0.5 });

        return () => {
            map.removeLayer(label);
        };
    }, [riderLat, riderLng, riderIndex]);

    // Draw elevation profile
    useEffect(() => {
        if (!elevCanvas.current || !route) return;
        const canvas = elevCanvas.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { width, height } = canvas.getBoundingClientRect();
        canvas.width = width * 2;
        canvas.height = height * 2;
        ctx.scale(2, 2);

        const pts = route.points;
        const minElev = Math.min(...pts.map(p => p.elevation));
        const maxElev = Math.max(...pts.map(p => p.elevation));
        const range = maxElev - minElev || 1;

        // Background
        ctx.clearRect(0, 0, width, height);

        // Elevation fill
        ctx.beginPath();
        ctx.moveTo(0, height);
        pts.forEach((p, i) => {
            const x = (i / (pts.length - 1)) * width;
            const y = height - ((p.elevation - minElev) / range) * (height - 4);
            ctx.lineTo(x, y);
        });
        ctx.lineTo(width, height);
        ctx.closePath();

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, 'rgba(0, 194, 255, 0.25)');
        grad.addColorStop(1, 'rgba(0, 194, 255, 0.02)');
        ctx.fillStyle = grad;
        ctx.fill();

        // Elevation line
        ctx.beginPath();
        pts.forEach((p, i) => {
            const x = (i / (pts.length - 1)) * width;
            const y = height - ((p.elevation - minElev) / range) * (height - 4);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#00c2ff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Progress marker
        const px = progress * width;
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, height);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
    }, [route, progress]);

    const gradeClass = grade > 1 ? 'grade-up' : grade < -1 ? 'grade-down' : 'grade-flat';

    return (
        <div className="world-map-container">
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            {/* Location Info */}
            {route && (
                <div className="world-map-info">
                    <div className="world-map-location">🚴 {route.name}</div>
                    <div className="world-map-country">{route.country}</div>
                    <div className="world-map-stats">
                        <span>⚡ <span className="world-map-stat-value">{Math.round(speed)}</span> km/h</span>
                        <span>🏔️ <span className="world-map-stat-value">{Math.round(elevation)}</span>m</span>
                        <span>×{multiplier}</span>
                    </div>
                </div>
            )}


            {/* Elevation Profile */}
            {route && (
                <div className="world-map-elevation">
                    <div className="world-map-elevation-label">Elevation</div>
                    <canvas ref={elevCanvas} />
                </div>
            )}
        </div>
    );
};
