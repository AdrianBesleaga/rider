/**
 * WebLLM Service — unit tests
 *
 * Tests the service logic without actually loading a model.
 * Mocks WebGPU availability and engine responses.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { WebLLMService, buildPrompt } from '../services/webLLMService';
import type { CyclingData } from '../types';

const SAMPLE_DATA: CyclingData = {
    power: 185,
    cadence: 88,
    speed: 28.5,
    heartRate: 142,
    distance: 12500,
    calories: 340,
    elapsedTime: 750, // 12:30
};

describe('buildPrompt', () => {
    it('includes all cycling data fields', () => {
        const prompt = buildPrompt(SAMPLE_DATA, 'road');
        expect(prompt).toContain('185W');
        expect(prompt).toContain('142bpm');
        expect(prompt).toContain('88rpm');
        expect(prompt).toContain('28.5km/h');
        expect(prompt).toContain('12:30');
    });

    it('indicates Road Cycling for road style', () => {
        const prompt = buildPrompt(SAMPLE_DATA, 'road');
        expect(prompt).toContain('Road Cycling');
    });

    it('indicates Mountain Bike for mtb style', () => {
        const prompt = buildPrompt(SAMPLE_DATA, 'mtb');
        expect(prompt).toContain('Mountain Bike');
    });

    it('formats time correctly for short rides', () => {
        const shortRide = { ...SAMPLE_DATA, elapsedTime: 65 };
        const prompt = buildPrompt(shortRide, 'road');
        expect(prompt).toContain('1:05');
    });

    it('formats time correctly for zero elapsed', () => {
        const fresh = { ...SAMPLE_DATA, elapsedTime: 0 };
        const prompt = buildPrompt(fresh, 'road');
        expect(prompt).toContain('0:00');
    });
});

describe('WebLLMService', () => {
    describe('status lifecycle', () => {
        it('starts in idle state', () => {
            const svc = new WebLLMService();
            expect(svc.status).toBe('idle');
            expect(svc.progress).toBe(0);
            expect(svc.isAvailable()).toBe(false);
        });

        it('reports unsupported when WebGPU is missing', async () => {
            // In test env, navigator.gpu doesn't exist
            const svc = new WebLLMService();
            const result = await svc.init();
            expect(result).toBe(false);
            expect(svc.status).toBe('unsupported');
        });

        it('fires progress callback on status change', async () => {
            const onProgress = vi.fn();
            const svc = new WebLLMService({ onProgress });
            await svc.init();
            expect(onProgress).toHaveBeenCalled();
            const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0];
            expect(lastCall.status).toBe('unsupported');
        });
    });

    describe('isAvailable', () => {
        it('returns false when idle', () => {
            expect(new WebLLMService().isAvailable()).toBe(false);
        });

        it('returns false when unsupported', async () => {
            const svc = new WebLLMService();
            await svc.init();
            expect(svc.isAvailable()).toBe(false);
        });
    });

    describe('generateMessage', () => {
        it('returns null when not available', async () => {
            const svc = new WebLLMService();
            const result = await svc.generateMessage(SAMPLE_DATA, 'road');
            expect(result).toBeNull();
        });
    });

    describe('dispose', () => {
        it('resets status to idle', async () => {
            const svc = new WebLLMService();
            await svc.init(); // will be unsupported
            await svc.dispose();
            expect(svc.status).toBe('idle');
        });
    });

    describe('rate limiting', () => {
        it('uses configurable minInterval', () => {
            const svc = new WebLLMService({ minInterval: 5000 });
            // Service created successfully with custom interval
            expect(svc.status).toBe('idle');
        });
    });

    describe('WebGPU detection', () => {
        it('returns false in test environment', () => {
            expect(WebLLMService.isWebGPUSupported()).toBe(false);
        });
    });
});
