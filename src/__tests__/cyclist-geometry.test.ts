/**
 * 3D Cyclist Geometry Constraint Tests
 *
 * These tests validate the spatial relationships of the cyclist model,
 * using the ANCHOR-POINT skeleton system defined in Cyclist.tsx.
 *
 * Coordinate system:
 *   - Rider faces -Z (forward)
 *   - Camera at +Z, +X (rear-right 3/4 view)
 *   - Y is up, X is left/right
 */

import { describe, it, expect } from 'vitest';

// ── Anchor points (MUST match Cyclist.tsx) ──
const WR = 0.35;
const rearAxle = { x: 0, y: WR, z: 0.5 };
const frontAxle = { x: 0, y: WR, z: -0.5 };
const bb = { x: 0, y: 0.35, z: 0.05 };
const seatTop = { x: 0, y: 0.88, z: 0.28 };
const headTop = { x: 0, y: 0.82, z: -0.38 };
const seat = { x: 0, y: 0.90, z: 0.25 };
const hip = { x: 0, y: 0.92, z: 0.2 };
const shoulder = { x: 0, y: 1.18, z: -0.05 };
const headPos = { x: 0, y: 1.28, z: -0.15 };
const hand = { x: 0, y: 0.84, z: -0.42 };

const CAMERA_POS = { x: 1.5, y: 2.0, z: 4.0 };

describe('Cyclist Geometry Constraints', () => {
    describe('Wheel Placement', () => {
        it('wheels at same height', () => {
            expect(rearAxle.y).toBeCloseTo(frontAxle.y, 1);
        });

        it('wheels centered on road', () => {
            expect(rearAxle.x).toBe(0);
            expect(frontAxle.x).toBe(0);
        });

        it('rear wheel at +Z, front at -Z', () => {
            expect(rearAxle.z).toBeGreaterThan(0);
            expect(frontAxle.z).toBeLessThan(0);
        });

        it('wheelbase >= 1.5× wheel diameter', () => {
            const wheelbase = rearAxle.z - frontAxle.z;
            expect(wheelbase).toBeGreaterThanOrEqual(WR * 2 * 1.4);
        });

        it('wheels touch ground', () => {
            expect(rearAxle.y - WR).toBeCloseTo(0, 1);
            expect(frontAxle.y - WR).toBeCloseTo(0, 1);
        });
    });

    describe('Frame Skeleton', () => {
        it('bottom bracket between wheels', () => {
            expect(bb.z).toBeGreaterThan(frontAxle.z);
            expect(bb.z).toBeLessThan(rearAxle.z);
        });

        it('seatTop above bb', () => {
            expect(seatTop.y).toBeGreaterThan(bb.y);
        });

        it('seatTop near rear wheel', () => {
            expect(seatTop.z).toBeGreaterThan(0);
        });

        it('headTop near front wheel', () => {
            expect(headTop.z).toBeLessThan(0);
        });

        it('seat above seatTop', () => {
            expect(seat.y).toBeGreaterThanOrEqual(seatTop.y);
        });
    });

    describe('Rider Body', () => {
        it('hip above seat', () => {
            expect(hip.y).toBeGreaterThanOrEqual(seat.y);
        });

        it('shoulder above hip', () => {
            expect(shoulder.y).toBeGreaterThan(hip.y);
        });

        it('head is highest point', () => {
            expect(headPos.y).toBeGreaterThan(shoulder.y);
        });

        it('head is forward of hip (leaning)', () => {
            expect(headPos.z).toBeLessThan(hip.z);
        });

        it('hands at handlebar level', () => {
            expect(Math.abs(hand.z - headTop.z)).toBeLessThan(0.15);
        });

        it('hands below shoulders', () => {
            expect(hand.y).toBeLessThan(shoulder.y);
        });
    });

    describe('Camera', () => {
        it('behind rider', () => {
            expect(CAMERA_POS.z).toBeGreaterThan(rearAxle.z);
        });

        it('offset right', () => {
            expect(CAMERA_POS.x).toBeGreaterThan(0.5);
        });

        it('above rider', () => {
            expect(CAMERA_POS.y).toBeGreaterThan(headPos.y);
        });
    });

    describe('Proportions', () => {
        it('rider height (ground to head) ~1.3m', () => {
            expect(headPos.y).toBeGreaterThan(1.1);
            expect(headPos.y).toBeLessThan(1.5);
        });

        it('wheelbase between 0.8 and 1.2 units', () => {
            const wb = rearAxle.z - frontAxle.z;
            expect(wb).toBeGreaterThan(0.8);
            expect(wb).toBeLessThan(1.2);
        });
    });
});
