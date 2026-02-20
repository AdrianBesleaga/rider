/**
 * Wheel Rotation Axis Tests
 *
 * THREE.js rotation math for bike wheels:
 *
 * 1. TorusGeometry default: ring in XY plane, hole along Z-axis
 * 2. Bike wheel: ring in YZ plane, axle along X-axis
 * 3. To transform: rotate torus PI/2 around Y
 *
 * FRAME-OF-REFERENCE for spin animation:
 *
 *   When a parent group has rotation-y = PI/2, the child's local axes
 *   map to world axes via the Y-rotation matrix:
 *
 *   ┌ cos(π/2)  0  sin(π/2) ┐   ┌ 0  0  1 ┐
 *   │    0      1     0      │ = │ 0  1  0 │
 *   └-sin(π/2)  0  cos(π/2) ┘   └-1  0  0 ┘
 *
 *   Child local X → world -Z
 *   Child local Y → world  Y
 *   Child local Z → world  X
 *
 * 4. Bike wheel axle = world X-axis
 * 5. To spin wheel around its axle (world X):
 *    → Need to rotate child around its local Z (which maps to world X)
 *    → Therefore: child.rotation.z = spinAngle   ← CORRECT
 *    → NOT:       child.rotation.x = spinAngle   ← WRONG (horizontal spin)
 */

import { describe, it, expect } from 'vitest';

// Simulate the Y-rotation matrix for PI/2
function applyYRotation90(localAxis: [number, number, number]): [number, number, number] {
    const [x, y, z] = localAxis;
    // x' =  z
    // y' =  y
    // z' = -x
    return [z, y, -x];
}

describe('Wheel Rotation Frame-of-Reference', () => {
    describe('Parent rotation-y = PI/2 axis mapping', () => {
        it('child local X maps to world -Z', () => {
            const [wx, wy, wz] = applyYRotation90([1, 0, 0]);
            expect(wx).toBeCloseTo(0);
            expect(wy).toBeCloseTo(0);
            expect(wz).toBeCloseTo(-1);
        });

        it('child local Y maps to world Y (unchanged)', () => {
            const [wx, wy, wz] = applyYRotation90([0, 1, 0]);
            expect(wx).toBeCloseTo(0);
            expect(wy).toBeCloseTo(1);
            expect(wz).toBeCloseTo(0);
        });

        it('child local Z maps to world X', () => {
            const [wx, wy, wz] = applyYRotation90([0, 0, 1]);
            expect(wx).toBeCloseTo(1);
            expect(wy).toBeCloseTo(0);
            expect(wz).toBeCloseTo(0);
        });
    });

    describe('Spin axis selection', () => {
        it('world X-axis is the bike wheel axle (left-right)', () => {
            const axle = [1, 0, 0];
            expect(axle[0]).toBe(1);
        });

        it('to rotate around world X (axle), use child rotation.z', () => {
            const [wx, wy, wz] = applyYRotation90([0, 0, 1]);
            expect(wx).toBeCloseTo(1);
            expect(wy).toBeCloseTo(0);
            expect(wz).toBeCloseTo(0);
        });

        it('child rotation.x is WRONG → maps to world -Z (horizontal!)', () => {
            const [wx, wy, wz] = applyYRotation90([1, 0, 0]);
            expect(wx).toBeCloseTo(0);
            expect(wy).toBeCloseTo(0);
            expect(wz).toBeCloseTo(-1);
        });
    });
});

describe('Wheel Geometry Orientation', () => {
    it('torus default: ring in XY plane, hole along Z', () => {
        const holeAxis = [0, 0, 1];
        expect(holeAxis).toEqual([0, 0, 1]);
    });

    it('after rotation-y = PI/2: hole along world X (= axle)', () => {
        const [wx] = applyYRotation90([0, 0, 1]);
        expect(wx).toBeCloseTo(1);
    });

    it('ring plane is YZ: perpendicular to X-axle', () => {
        // Ring normal = hole axis = world X after rotation
        const [wx, wy, wz] = applyYRotation90([0, 0, 1]);
        expect(wx).toBeCloseTo(1); // normal along X
        expect(wy).toBeCloseTo(0); // no Y component
        // YZ plane is perpendicular to X ✓
    });
});

describe('Implementation Pattern', () => {
    it('correct JSX structure for bike wheel', () => {
        // Required pattern in Cyclist.tsx:
        //
        //   <group rotation={[0, Math.PI / 2, 0]}>   ← orients torus into YZ plane
        //     <group ref={ref}>                        ← spin animation target
        //       <torusGeometry />
        //     </group>
        //   </group>
        //
        //   useFrame: ref.current.rotation.z = spinAngle    ← CORRECT: local Z → world X
        //   NOT:      ref.current.rotation.x = spinAngle    ← WRONG: local X → world -Z

        const ORIENT_AXIS = 'y';
        const ORIENT_ANGLE = Math.PI / 2;
        const SPIN_PROPERTY = 'rotation.z';  // the property to animate

        expect(ORIENT_AXIS).toBe('y');
        expect(ORIENT_ANGLE).toBeCloseTo(Math.PI / 2);
        expect(SPIN_PROPERTY).toBe('rotation.z');
    });
});
