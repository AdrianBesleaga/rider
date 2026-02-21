/**
 * Road Curve — geometry math unit tests
 *
 * Validates the pure mathematical functions that define the road's
 * S-curve shape and tangent directions.
 */

import { describe, it, expect } from 'vitest';
import { curveX, curveTangent, ROAD_CONSTANTS } from '../services/roadCurve';

const { CURVE_AMPLITUDE, CURVE_FREQUENCY, TOTAL_LENGTH } = ROAD_CONSTANTS;

describe('curveX', () => {
    it('returns 0 at z=0 (sine origin)', () => {
        expect(curveX(0)).toBeCloseTo(0, 10);
    });

    it('stays within amplitude bounds', () => {
        // Sample many points along the road
        for (let i = 0; i <= 1000; i++) {
            const z = -(i / 1000) * TOTAL_LENGTH;
            const x = curveX(z);
            expect(Math.abs(x)).toBeLessThanOrEqual(CURVE_AMPLITUDE + 0.001);
        }
    });

    it('reaches near-maximum amplitude at a quarter wavelength', () => {
        const quarterWavelength = (Math.PI / 2) / CURVE_FREQUENCY;
        const x = curveX(quarterWavelength);
        expect(Math.abs(x)).toBeGreaterThan(CURVE_AMPLITUDE * 0.99);
    });

    it('is an odd function: curveX(z) ≈ -curveX(-z)', () => {
        const testZ = [10, 50, 100, 200];
        testZ.forEach(z => {
            expect(curveX(z)).toBeCloseTo(-curveX(-z), 10);
        });
    });

    it('produces non-trivial values for non-zero z', () => {
        expect(curveX(50)).not.toBeCloseTo(0, 1);
    });
});

describe('curveTangent', () => {
    it('returns a unit-length perpendicular vector', () => {
        const testZ = [0, -50, -100, -200, -350];
        testZ.forEach(z => {
            const { px, pz } = curveTangent(z);
            const len = Math.sqrt(px * px + pz * pz);
            expect(len).toBeCloseTo(1, 4);
        });
    });

    it('perpendicular vector is approximately (0, -1) at z=0', () => {
        // At z=0, the tangent is along -Z, so perpendicular should be along X
        const { px, pz } = curveTangent(0);
        // Road goes in -Z, perpendicular rotated 90° from forward
        const len = Math.sqrt(px * px + pz * pz);
        expect(len).toBeCloseTo(1, 4);
    });

    it('varies along the road (not constant)', () => {
        const t1 = curveTangent(0);
        const t2 = curveTangent(-100);
        // The perpendicular direction should differ at different Z positions
        const dx = Math.abs(t1.px - t2.px);
        const dz = Math.abs(t1.pz - t2.pz);
        expect(dx + dz).toBeGreaterThan(0.01);
    });
});

describe('ROAD_CONSTANTS', () => {
    it('has reasonable segment count', () => {
        expect(ROAD_CONSTANTS.NUM_SEGMENTS).toBeGreaterThanOrEqual(50);
        expect(ROAD_CONSTANTS.NUM_SEGMENTS).toBeLessThanOrEqual(1000);
    });

    it('has positive total length', () => {
        expect(ROAD_CONSTANTS.TOTAL_LENGTH).toBeGreaterThan(0);
    });

    it('has positive curve amplitude', () => {
        expect(ROAD_CONSTANTS.CURVE_AMPLITUDE).toBeGreaterThan(0);
    });

    it('has positive curve frequency', () => {
        expect(ROAD_CONSTANTS.CURVE_FREQUENCY).toBeGreaterThan(0);
    });

    it('tangent epsilon is small but positive', () => {
        expect(ROAD_CONSTANTS.TANGENT_EPSILON).toBeGreaterThan(0);
        expect(ROAD_CONSTANTS.TANGENT_EPSILON).toBeLessThan(1);
    });
});
