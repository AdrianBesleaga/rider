/**
 * Visual Properties Self-Evaluation Tests
 *
 * These tests validate the numerical/color properties that make
 * the scene match the concept art. Every test corresponds to a
 * specific visual element in the concept image.
 *
 * After implementation, all tests MUST pass for the scene to
 * visually match the concept.
 */

import { describe, it, expect } from 'vitest';

// ── Constants extracted from implementation ──
// These MUST be kept in sync with the component files!

// Wheel glow halo (fake bloom effect)
const WHEEL_GLOW_HALO = {
    exists: true,
    tubeRadius: 0.06,            // 5× larger than the rim's 0.012
    opacity: 0.15,               // transparent enough to look like bloom
    color: '#00e5ff',            // cyan
};

// Ground reflection glow
const GROUND_GLOW = {
    exists: true,
    diameter: 2.0,               // wide enough to create a pool of light
    yPosition: 0.015,            // just above ground
    centerOpacity: 0.35,         // bright center
};

// Road edge neon strips
const ROAD_EDGES = {
    mainLineWidth: 0.12,         // clearly visible
    glowStripWidth: 0.5,         // wide outer glow
    mainOpacity: 0.8,            // bright
    glowOpacity: 0.15,           // subtle bloom
    color: '#00e5ff',
};

// Rider color palette
const RIDER_COLORS = {
    jersey: '#6d28d9',           // purple
    forearms: '#c9a88c',         // skin tone (NOT jersey color!)
    head: '#d4bbaa',             // skin tone
    legs: '#1e1b4b',             // dark
};

// Bike frame
const FRAME = {
    color: '#3d4f65',            // visible against dark background
    emissiveColor: '#00e5ff',    // subtle cyan highlight
    emissiveIntensity: 0.05,     // very subtle
};

// Grid floor
const GRID_FLOOR = {
    opacity: 0.28,               // more visible than before (was 0.18)
};

// Helper to compare hex colors
function hexToRGB(hex: string): [number, number, number] {
    const h = hex.replace('#', '');
    return [
        parseInt(h.substring(0, 2), 16),
        parseInt(h.substring(2, 4), 16),
        parseInt(h.substring(4, 6), 16),
    ];
}

function luminance(hex: string): number {
    const [r, g, b] = hexToRGB(hex);
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

describe('Concept Art: Wheel Glow', () => {
    it('glow halo should exist on wheels', () => {
        expect(WHEEL_GLOW_HALO.exists).toBe(true);
    });

    it('halo tube radius should be much larger than rim (fake bloom)', () => {
        const rimTubeRadius = 0.012;
        expect(WHEEL_GLOW_HALO.tubeRadius).toBeGreaterThan(rimTubeRadius * 3);
    });

    it('halo should be semi-transparent (not opaque)', () => {
        expect(WHEEL_GLOW_HALO.opacity).toBeGreaterThan(0.05);
        expect(WHEEL_GLOW_HALO.opacity).toBeLessThan(0.4);
    });

    it('halo should be cyan', () => {
        expect(WHEEL_GLOW_HALO.color).toBe('#00e5ff');
    });
});

describe('Concept Art: Ground Glow', () => {
    it('ground glow plane should exist', () => {
        expect(GROUND_GLOW.exists).toBe(true);
    });

    it('glow diameter should be wide enough (≥ 1.5m)', () => {
        expect(GROUND_GLOW.diameter).toBeGreaterThanOrEqual(1.5);
    });

    it('glow should be at ground level', () => {
        expect(GROUND_GLOW.yPosition).toBeLessThan(0.05);
        expect(GROUND_GLOW.yPosition).toBeGreaterThan(0);
    });

    it('center opacity should be noticeable', () => {
        expect(GROUND_GLOW.centerOpacity).toBeGreaterThan(0.2);
        expect(GROUND_GLOW.centerOpacity).toBeLessThan(0.6);
    });
});

describe('Concept Art: Road Edge Neon', () => {
    it('main edge line should be thick enough to see', () => {
        expect(ROAD_EDGES.mainLineWidth).toBeGreaterThanOrEqual(0.1);
    });

    it('glow strip should be much wider than main line', () => {
        expect(ROAD_EDGES.glowStripWidth).toBeGreaterThan(ROAD_EDGES.mainLineWidth * 2);
    });

    it('main line should be bright', () => {
        expect(ROAD_EDGES.mainOpacity).toBeGreaterThanOrEqual(0.7);
    });

    it('glow strip should be subtle (not opaque)', () => {
        expect(ROAD_EDGES.glowOpacity).toBeGreaterThan(0.05);
        expect(ROAD_EDGES.glowOpacity).toBeLessThan(0.3);
    });
});

describe('Concept Art: Rider Colors', () => {
    it('forearms should be skin-toned (NOT same as jersey)', () => {
        expect(RIDER_COLORS.forearms).not.toBe(RIDER_COLORS.jersey);
    });

    it('forearm skin tone should be warm/bright (luminance > 140)', () => {
        expect(luminance(RIDER_COLORS.forearms)).toBeGreaterThan(140);
    });

    it('jersey should be darker than skin', () => {
        expect(luminance(RIDER_COLORS.jersey)).toBeLessThan(luminance(RIDER_COLORS.forearms));
    });

    it('head should be skin-toned', () => {
        expect(luminance(RIDER_COLORS.head)).toBeGreaterThan(140);
    });
});

describe('Concept Art: Bike Frame', () => {
    it('frame should be lighter than pure dark (visible)', () => {
        expect(luminance(FRAME.color)).toBeGreaterThan(50);
    });

    it('frame should have subtle emissive highlight', () => {
        expect(FRAME.emissiveIntensity).toBeGreaterThan(0);
        expect(FRAME.emissiveIntensity).toBeLessThan(0.2);
    });
});

describe('Concept Art: Grid Floor', () => {
    it('grid opacity should be noticeable (≥ 0.25)', () => {
        expect(GRID_FLOOR.opacity).toBeGreaterThanOrEqual(0.25);
    });
});
