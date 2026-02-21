/**
 * WebLLM Service — In-browser AI cycling coach
 *
 * Uses @mlc-ai/web-llm to run Llama-3.2-1B-Instruct entirely in the browser
 * via WebGPU. Generates real-time coaching messages from live cycling data.
 *
 * Designed for testability:
 *   - Class-based with injectable dependencies
 *   - Clear status transitions: idle → loading → ready | unsupported | error
 *   - Falls back silently to static MessageQueue when WebGPU is unavailable
 */

import type { CyclingData, RideStyle } from '../types';

// ─── Types ───

export type WebLLMStatus = 'idle' | 'loading' | 'ready' | 'unsupported' | 'error';

export interface WebLLMProgress {
    status: WebLLMStatus;
    progress: number;   // 0-100
    message: string;    // human-readable status text
}

// ─── Constants ───

const MODEL_ID = 'Llama-3.2-1B-Instruct-q4f16_1-MLC';

const SYSTEM_PROMPT = `You are a cycling coach riding alongside the user during an indoor training session. Your role is to provide short, impactful coaching tips AND motivational encouragement based on their live performance data.

Rules:
- Keep messages to 1-2 sentences MAX (under 30 words)
- Mix coaching advice with motivation (alternate between them)
- React specifically to their current data when possible
- Use cycling terminology naturally
- Be energetic and supportive, never negative
- Include relevant emoji occasionally

Topics to cover:
- Power zone analysis and pacing tips
- Cadence optimization
- Heart rate zone coaching
- Hydration and nutrition reminders
- Breathing technique
- Mental toughness and push-through encouragement
- Form and posture cues`;

function formatTime(seconds: number): string {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
}

/**
 * Build the user prompt with current ride data.
 */
export function buildPrompt(data: CyclingData, style: RideStyle): string {
    return `Ride style: ${style === 'mtb' ? 'Mountain Bike' : 'Road Cycling'}
Current stats — Power: ${Math.round(data.power)}W, HR: ${Math.round(data.heartRate)}bpm, Cadence: ${Math.round(data.cadence)}rpm, Speed: ${data.speed.toFixed(1)}km/h, Elapsed: ${formatTime(data.elapsedTime)}.
Give me one coaching tip or motivational message.`;
}

// ─── Service Class ───

export class WebLLMService {
    private engine: any = null;
    private _status: WebLLMStatus = 'idle';
    private _progress = 0;
    private _message = '';
    private _lastGenTime = 0;
    private _minInterval: number;
    private _onProgress?: (p: WebLLMProgress) => void;

    constructor(options?: { minInterval?: number; onProgress?: (p: WebLLMProgress) => void }) {
        this._minInterval = options?.minInterval ?? 25_000; // 25s between generations
        this._onProgress = options?.onProgress;
    }

    get status(): WebLLMStatus { return this._status; }
    get progress(): number { return this._progress; }
    get progressMessage(): string { return this._message; }

    isAvailable(): boolean {
        return this._status === 'ready';
    }

    /**
     * Detect WebGPU support.
     */
    static isWebGPUSupported(): boolean {
        return typeof navigator !== 'undefined' && 'gpu' in navigator;
    }

    /**
     * Initialize the engine: detect WebGPU, download and load the model.
     */
    async init(): Promise<boolean> {
        console.log('[WebLLM] init() called, current status:', this._status);
        if (this._status === 'ready') return true;
        if (this._status === 'loading') return false;

        if (!WebLLMService.isWebGPUSupported()) {
            console.log('[WebLLM] WebGPU not supported — falling back to static facts');
            this.setStatus('unsupported', 0, 'WebGPU not available — using static facts');
            return false;
        }

        console.log('[WebLLM] WebGPU detected ✓ — loading model:', MODEL_ID);
        this.setStatus('loading', 0, 'Initializing AI engine…');

        try {
            // Dynamic import to avoid bundling web-llm when not needed
            const { CreateMLCEngine } = await import('@mlc-ai/web-llm');

            this.engine = await CreateMLCEngine(MODEL_ID, {
                initProgressCallback: (progress: any) => {
                    const pct = Math.round((progress.progress ?? 0) * 100);
                    const text = progress.text ?? 'Loading model…';
                    this.setStatus('loading', pct, text);
                },
            });

            console.log('[WebLLM] ✅ Model loaded — AI coach ready');
            this.setStatus('ready', 100, 'AI coach ready');
            return true;
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            console.warn('[WebLLM] Init failed:', msg);
            this.setStatus('error', 0, `AI init failed: ${msg}`);
            return false;
        }
    }

    /**
     * Generate a coaching message from live cycling data.
     * Rate-limited to prevent GPU saturation.
     */
    async generateMessage(data: CyclingData, style: RideStyle): Promise<string | null> {
        if (!this.isAvailable() || !this.engine) {
            console.log('[WebLLM] generateMessage skipped — not available');
            return null;
        }

        // Rate limit
        const now = Date.now();
        const elapsed = now - this._lastGenTime;
        if (elapsed < this._minInterval) {
            console.log(`[WebLLM] Rate limited — ${Math.round((this._minInterval - elapsed) / 1000)}s until next generation`);
            return null;
        }
        this._lastGenTime = now;
        console.log(`[WebLLM] Generating message — Power: ${Math.round(data.power)}W, HR: ${Math.round(data.heartRate)}bpm, Cadence: ${Math.round(data.cadence)}rpm`);

        try {
            const reply = await this.engine.chat.completions.create({
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: buildPrompt(data, style) },
                ],
                max_tokens: 60,
                temperature: 0.8,
                top_p: 0.9,
            });

            const text = reply.choices?.[0]?.message?.content?.trim();
            console.log('[WebLLM] ✅ Generated:', text?.substring(0, 80));
            return text || null;
        } catch (err) {
            console.warn('[WebLLM] Generation failed:', err);
            return null;
        }
    }

    /**
     * Generate a fun fact about a city from its Wikipedia summary.
     */
    async generateCityFact(cityName: string, summary: string): Promise<string | null> {
        if (!this.isAvailable() || !this.engine) return null;

        try {
            // Reset chat to avoid WASM tokenizer state buildup
            await this.engine.resetChat();

            const reply = await this.engine.chat.completions.create({
                messages: [
                    { role: 'system', content: 'You generate one short, interesting fact about a city for a cyclist exploring the world. Rules: 1) Always state facts as STATEMENTS, never as questions. 2) Keep it to 1 sentence, under 25 words. 3) Be surprising and fun. 4) No intro or prefix, just the fact itself.' },
                    { role: 'user', content: `City: ${cityName}\nContext: ${summary.substring(0, 300)}\nGenerate one surprising fact:` },
                ],
                max_tokens: 50,
                temperature: 0.9,
                top_p: 0.95,
            });
            return reply.choices?.[0]?.message?.content?.trim() || null;
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);

            // WASM BindingError: tokenizer corrupted — reinitialize engine
            if (msg.includes('BindingError') || msg.includes('VectorInt')) {
                console.warn('[WebLLM] WASM binding corrupted — reinitializing engine…');
                try {
                    await this.engine.unload();
                } catch { /* ignore */ }
                this.engine = null;
                this._status = 'idle';
                // Re-init in background — next call will succeed
                this.init();
                return null;
            }

            console.warn('[WebLLM] City fact generation failed:', msg);
            return null;
        }
    }

    /**
     * Dispose the engine and free GPU resources.
     */
    async dispose(): Promise<void> {
        if (this.engine) {
            try {
                await this.engine.unload();
            } catch { /* ignore */ }
            this.engine = null;
        }
        this.setStatus('idle', 0, '');
    }

    private setStatus(status: WebLLMStatus, progress: number, message: string): void {
        this._status = status;
        this._progress = progress;
        this._message = message;
        this._onProgress?.({ status, progress, message });
    }
}
