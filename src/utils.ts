/**
 * Shared Utilities
 *
 * Generic helper functions used across the application.
 */

/**
 * Fisher-Yates shuffle — returns a new shuffled copy of the array.
 * Does NOT mutate the original.
 */
export function shuffle<T>(arr: readonly T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}
