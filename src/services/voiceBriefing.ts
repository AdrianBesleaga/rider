/**
 * Voice Briefing — TTS reads news headlines while you ride
 *
 * Uses the browser's native SpeechSynthesis API (no external dependencies).
 * Reads one headline at a time with pauses between each item.
 */

import { NewsItem } from '../types';

let speaking = false;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let queue: string[] = [];

export function isVoiceBriefingAvailable(): boolean {
    return 'speechSynthesis' in window;
}

export function isVoiceSpeaking(): boolean {
    return speaking;
}

export function startVoiceBriefing(items: NewsItem[]): void {
    if (!isVoiceBriefingAvailable()) return;

    stopVoiceBriefing();

    queue = items.map(
        (item) => `${item.category} news: ${item.title}. ${item.summary}`,
    );

    speaking = true;
    speakNext();
}

function speakNext(): void {
    if (queue.length === 0 || !speaking) {
        speaking = false;
        return;
    }

    const text = queue.shift()!;
    const utterance = new SpeechSynthesisUtterance(text);
    currentUtterance = utterance;

    // Prefer a natural English voice
    const voices = speechSynthesis.getVoices();
    const preferred = voices.find(
        (v) => v.lang.startsWith('en') && v.name.toLowerCase().includes('natural'),
    ) ?? voices.find(
        (v) => v.lang.startsWith('en'),
    );
    if (preferred) utterance.voice = preferred;

    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onend = () => {
        // Pause between items
        setTimeout(() => speakNext(), 1500);
    };

    utterance.onerror = () => {
        speakNext();
    };

    speechSynthesis.speak(utterance);
}

export function stopVoiceBriefing(): void {
    speaking = false;
    queue = [];
    speechSynthesis.cancel();
    currentUtterance = null;
}

export function pauseVoiceBriefing(): void {
    speechSynthesis.pause();
}

export function resumeVoiceBriefing(): void {
    speechSynthesis.resume();
}
