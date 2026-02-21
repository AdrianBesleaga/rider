/**
 * Road Curve Math — pure functions for procedural S-curve road geometry
 *
 * Extracted from Road.tsx to enable unit testing and reuse.
 * The road follows a sine wave on the X axis for gentle S-curves.
 */

// ─── Constants ───

export const ROAD_CONSTANTS = {
    /** Number of vertices along the road path */
    NUM_SEGMENTS: 200,
    /** Total Z span of the road strip */
    TOTAL_LENGTH: 400,
    /** Max X offset from center (sine amplitude) */
    CURVE_AMPLITUDE: 3,
    /** Sine wave frequency */
    CURVE_FREQUENCY: 0.015,
    /** Small epsilon for numerical tangent approximation */
    TANGENT_EPSILON: 0.1,
} as const;

// ─── Curve Functions ───

/**
 * Sample the road's X position at a given Z coordinate.
 * Returns the lateral offset from center following a sine wave.
 */
export function curveX(z: number): number {
    return Math.sin(z * ROAD_CONSTANTS.CURVE_FREQUENCY) * ROAD_CONSTANTS.CURVE_AMPLITUDE;
}

/**
 * Perpendicular direction to the curve tangent at position Z.
 *
 * Returns `{ px, pz }` — the unit vector perpendicular to the tangent,
 * pointing to the left of the forward direction. Used for offsetting
 * road edges and lane markings.
 */
export function curveTangent(z: number): { px: number; pz: number } {
    const eps = ROAD_CONSTANTS.TANGENT_EPSILON;
    const zNext = z - eps;
    const cx = curveX(z);
    const cxNext = curveX(zNext);
    const dx = cxNext - cx;
    const dz = zNext - z;
    const len = Math.sqrt(dx * dx + dz * dz);
    return {
        px: -dz / len,
        pz: dx / len,
    };
}
