/**
 * Ride Facts — data integrity tests
 *
 * Validates that the static fact pool is well-formed and has
 * sufficient coverage across all categories.
 */

import { describe, it, expect } from 'vitest';
import { RIDE_FACTS, RideFact } from '../data/rideFacts';

describe('Ride Facts Data Integrity', () => {
    it('has at least 80 total facts', () => {
        expect(RIDE_FACTS.length).toBeGreaterThanOrEqual(80);
    });

    it('every fact has a non-empty text', () => {
        RIDE_FACTS.forEach((fact, i) => {
            expect(fact.text.trim().length, `Fact at index ${i} has empty text`).toBeGreaterThan(0);
        });
    });

    it('every fact has a valid category', () => {
        const validCategories = new Set(['road', 'mtb', 'motivation']);
        RIDE_FACTS.forEach((fact, i) => {
            expect(validCategories.has(fact.category), `Fact at index ${i} has invalid category '${fact.category}'`).toBe(true);
        });
    });

    it('has at least 20 road facts', () => {
        const count = RIDE_FACTS.filter(f => f.category === 'road').length;
        expect(count).toBeGreaterThanOrEqual(20);
    });

    it('has at least 20 MTB facts', () => {
        const count = RIDE_FACTS.filter(f => f.category === 'mtb').length;
        expect(count).toBeGreaterThanOrEqual(20);
    });

    it('has at least 20 motivational messages', () => {
        const count = RIDE_FACTS.filter(f => f.category === 'motivation').length;
        expect(count).toBeGreaterThanOrEqual(20);
    });

    it('has no exact duplicate texts', () => {
        const texts = RIDE_FACTS.map(f => f.text);
        const uniqueTexts = new Set(texts);
        expect(uniqueTexts.size).toBe(texts.length);
    });

    it('all facts conform to the RideFact interface', () => {
        RIDE_FACTS.forEach((fact) => {
            expect(typeof fact.text).toBe('string');
            expect(typeof fact.category).toBe('string');
        });
    });
});
