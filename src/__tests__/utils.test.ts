/**
 * Utils — shuffle correctness tests
 */

import { describe, it, expect } from 'vitest';
import { shuffle } from '../utils';

describe('shuffle', () => {
    it('preserves all elements', () => {
        const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const result = shuffle(input);
        expect(result).toHaveLength(input.length);
        expect(result.sort()).toEqual(input.sort());
    });

    it('does not mutate the original array', () => {
        const input = [1, 2, 3, 4, 5];
        const copy = [...input];
        shuffle(input);
        expect(input).toEqual(copy);
    });

    it('handles empty arrays', () => {
        expect(shuffle([])).toEqual([]);
    });

    it('handles single-element arrays', () => {
        expect(shuffle([42])).toEqual([42]);
    });

    it('returns a new array instance', () => {
        const input = [1, 2, 3];
        const result = shuffle(input);
        expect(result).not.toBe(input);
    });

    it('produces different orderings (probabilistic)', () => {
        const input = Array.from({ length: 20 }, (_, i) => i);
        // Run 10 shuffles, at least one should differ from original
        const results = Array.from({ length: 10 }, () => shuffle(input));
        const someShuffled = results.some(
            (r) => r.some((val, idx) => val !== input[idx])
        );
        expect(someShuffled).toBe(true);
    });
});
