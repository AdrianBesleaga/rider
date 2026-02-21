/**
 * Ride Message Service
 *
 * Provides shuffled motivational messages + cycling facts during rides.
 * Uses a class-based design for testability (no module-level mutable state).
 */

import { RIDE_FACTS, RideFact } from '../data/rideFacts';
import type { RideStyle } from '../types';
import { shuffle } from '../utils';

/**
 * MessageQueue — shuffles and serves messages based on ride style.
 *
 * Messages are interleaved at a ~70/30 ratio (facts vs motivation).
 * When the queue is exhausted, it automatically rebuilds with a fresh shuffle.
 */
export class MessageQueue {
    private queue: string[] = [];
    private index = 0;
    private style: RideStyle | null = null;
    private readonly facts: RideFact[];

    constructor(facts: RideFact[] = RIDE_FACTS) {
        this.facts = facts;
    }

    /**
     * Build a shuffled message queue: ~70% facts (matching ride style), ~30% motivation.
     */
    private buildQueue(style: RideStyle): string[] {
        const styleFacts = shuffle(this.facts.filter(f => f.category === style));
        const motivations = shuffle(this.facts.filter(f => f.category === 'motivation'));

        const result: string[] = [];
        let fi = 0;
        let mi = 0;

        // For every 10 items, ~7 facts + ~3 motivation
        while (fi < styleFacts.length || mi < motivations.length) {
            for (let k = 0; k < 7 && fi < styleFacts.length; k++, fi++) {
                result.push(styleFacts[fi].text);
            }
            for (let k = 0; k < 3 && mi < motivations.length; k++, mi++) {
                result.push(motivations[mi].text);
            }
        }

        return result;
    }

    /**
     * Get the next message for the given ride style.
     * Automatically re-initializes if style changes or queue is exhausted.
     */
    getNext(style: RideStyle): string {
        if (style !== this.style || this.index >= this.queue.length) {
            this.queue = this.buildQueue(style);
            this.index = 0;
            this.style = style;
        }

        return this.queue[this.index++];
    }

    /** Reset the queue (e.g. on new ride) */
    reset(): void {
        this.queue = [];
        this.index = 0;
        this.style = null;
    }

    /** Current queue length (for testing) */
    get length(): number {
        return this.queue.length;
    }
}

// ─── Default singleton for app-wide use ───

const defaultQueue = new MessageQueue();

export function getNextMessage(style: RideStyle): string {
    return defaultQueue.getNext(style);
}

export function resetMessageQueue(): void {
    defaultQueue.reset();
}
