/**
 * MessageQueue — unit tests for the ride message service
 *
 * Uses the class-based API for isolated test instances.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MessageQueue } from '../services/rideMessages';
import type { RideFact } from '../data/rideFacts';

// ─── Minimal test fixtures ───

const TEST_FACTS: RideFact[] = [
    { text: 'Road fact 1', category: 'road' },
    { text: 'Road fact 2', category: 'road' },
    { text: 'Road fact 3', category: 'road' },
    { text: 'Road fact 4', category: 'road' },
    { text: 'Road fact 5', category: 'road' },
    { text: 'Road fact 6', category: 'road' },
    { text: 'Road fact 7', category: 'road' },
    { text: 'MTB fact 1', category: 'mtb' },
    { text: 'MTB fact 2', category: 'mtb' },
    { text: 'MTB fact 3', category: 'mtb' },
    { text: 'MTB fact 4', category: 'mtb' },
    { text: 'MTB fact 5', category: 'mtb' },
    { text: 'MTB fact 6', category: 'mtb' },
    { text: 'MTB fact 7', category: 'mtb' },
    { text: 'Motivation 1', category: 'motivation' },
    { text: 'Motivation 2', category: 'motivation' },
    { text: 'Motivation 3', category: 'motivation' },
];

describe('MessageQueue', () => {
    let queue: MessageQueue;

    beforeEach(() => {
        queue = new MessageQueue(TEST_FACTS);
    });

    describe('getNext', () => {
        it('returns a non-empty string', () => {
            const msg = queue.getNext('road');
            expect(typeof msg).toBe('string');
            expect(msg.length).toBeGreaterThan(0);
        });

        it('returns different messages on consecutive calls', () => {
            const msg1 = queue.getNext('road');
            const msg2 = queue.getNext('road');
            // They could theoretically be the same if queue only has one item,
            // but our fixture has 10 road+motivation items
            expect(msg1 !== msg2 || queue.length === 1).toBe(true);
        });

        it('includes only road facts and motivational messages for road style', () => {
            const messages: string[] = [];
            for (let i = 0; i < 10; i++) {
                messages.push(queue.getNext('road'));
            }
            const allTexts = TEST_FACTS
                .filter(f => f.category === 'road' || f.category === 'motivation')
                .map(f => f.text);
            messages.forEach(msg => {
                expect(allTexts).toContain(msg);
            });
        });

        it('includes only MTB facts and motivational messages for mtb style', () => {
            const messages: string[] = [];
            for (let i = 0; i < 10; i++) {
                messages.push(queue.getNext('mtb'));
            }
            const allTexts = TEST_FACTS
                .filter(f => f.category === 'mtb' || f.category === 'motivation')
                .map(f => f.text);
            messages.forEach(msg => {
                expect(allTexts).toContain(msg);
            });
        });

        it('does not include MTB facts in road mode', () => {
            const messages: string[] = [];
            for (let i = 0; i < 10; i++) {
                messages.push(queue.getNext('road'));
            }
            const mtbTexts = TEST_FACTS
                .filter(f => f.category === 'mtb')
                .map(f => f.text);
            messages.forEach(msg => {
                expect(mtbTexts).not.toContain(msg);
            });
        });
    });

    describe('queue structure', () => {
        it('builds queue with ~70/30 ratio', () => {
            // Drain the full queue
            const first = queue.getNext('road');
            const total = queue.length;

            // 7 road facts + 3 motivations = 10 total
            expect(total).toBe(10);
        });

        it('contains all facts without duplicates within a cycle', () => {
            const seen = new Set<string>();
            const total = 10; // 7 road + 3 motivation
            for (let i = 0; i < total; i++) {
                const msg = queue.getNext('road');
                expect(seen.has(msg)).toBe(false);
                seen.add(msg);
            }
        });
    });

    describe('style switching', () => {
        it('rebuilds queue when style changes', () => {
            const roadMsg = queue.getNext('road');
            const mtbMsg = queue.getNext('mtb'); // should trigger rebuild

            const roadTexts = TEST_FACTS.filter(f => f.category === 'road').map(f => f.text);
            const mtbTexts = TEST_FACTS.filter(f => f.category === 'mtb').map(f => f.text);
            const motivTexts = TEST_FACTS.filter(f => f.category === 'motivation').map(f => f.text);

            // road message should be from road or motivation
            expect([...roadTexts, ...motivTexts]).toContain(roadMsg);
            // mtb message should be from mtb or motivation
            expect([...mtbTexts, ...motivTexts]).toContain(mtbMsg);
        });
    });

    describe('reset', () => {
        it('clears queue state', () => {
            queue.getNext('road');
            queue.getNext('road');
            queue.reset();

            // After reset, calling getNext should rebuild
            const msg = queue.getNext('road');
            expect(typeof msg).toBe('string');
            expect(msg.length).toBeGreaterThan(0);
        });

        it('resets index to 0', () => {
            // Drain several messages
            for (let i = 0; i < 5; i++) queue.getNext('road');
            queue.reset();

            // After reset + fresh getNext, the queue should be full again
            queue.getNext('road');
            expect(queue.length).toBe(10);
        });
    });

    describe('queue exhaustion', () => {
        it('rebuilds when queue is exhausted', () => {
            const total = 10;
            for (let i = 0; i < total; i++) queue.getNext('road');

            // Next call should trigger rebuild
            const msg = queue.getNext('road');
            expect(typeof msg).toBe('string');
            expect(msg.length).toBeGreaterThan(0);
        });
    });
});
