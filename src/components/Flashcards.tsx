import React, { useState, useEffect, useMemo } from 'react';
import './Flashcards.css';

interface Flashcard {
    id: string;
    question: string;
    answer: string;
    category: string;
}

interface FlashcardsProps {
    /** Current cadence — each pedal stroke can trigger card flip */
    cadence: number;
}

const CARDS: Flashcard[] = [
    { id: '1', question: 'What is a SPAC?', answer: 'Special Purpose Acquisition Company — a blank-check company formed to raise capital through an IPO to acquire an existing business.', category: 'Finance' },
    { id: '2', question: 'What does "ARR" stand for?', answer: 'Annual Recurring Revenue — key SaaS metric measuring predictable yearly revenue from subscriptions.', category: 'Startup' },
    { id: '3', question: 'What is a Transformer in ML?', answer: 'A neural network architecture that uses self-attention to process sequences in parallel. Powers GPT, BERT, and most modern LLMs.', category: 'AI' },
    { id: '4', question: 'What is DeFi?', answer: 'Decentralized Finance — financial services built on blockchain without traditional intermediaries like banks.', category: 'Crypto' },
    { id: '5', question: 'What is "product-market fit"?', answer: 'The point where a product satisfies a strong market demand — typically measured by retention rates and organic growth.', category: 'Startup' },
    { id: '6', question: 'What is RAG in AI?', answer: 'Retrieval-Augmented Generation — a technique that grounds LLM responses by retrieving relevant documents before generating answers.', category: 'AI' },
    { id: '7', question: 'What is a "liquidation event"?', answer: 'Any transaction that converts equity ownership into cash — IPO, acquisition, or secondary sale.', category: 'Finance' },
    { id: '8', question: 'What is TVL in crypto?', answer: 'Total Value Locked — the sum of all assets deposited in a DeFi protocol, used to measure its scale and adoption.', category: 'Crypto' },
    { id: '9', question: 'What is edge computing?', answer: 'Processing data near its source (devices, sensors) rather than in a centralized data center, reducing latency.', category: 'Tech' },
    { id: '10', question: 'What is "burn rate"?', answer: 'The rate at which a startup spends its cash reserves before becoming profitable. Usually measured monthly.', category: 'Startup' },
    { id: '11', question: 'What is fine-tuning?', answer: 'Training a pre-trained model on a specific dataset to specialize it for a particular task or domain.', category: 'AI' },
    { id: '12', question: 'What is a "moat" in business?', answer: 'A sustainable competitive advantage that protects a company from competitors — brand, network effects, IP, switching costs.', category: 'Startup' },
];

export const Flashcards: React.FC<FlashcardsProps> = ({ cadence }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [flipped, setFlipped] = useState(false);
    const [answered, setAnswered] = useState(0);

    // Shuffle deck once
    const deck = useMemo(() => [...CARDS].sort(() => Math.random() - 0.5), []);

    // Cadence-driven: flip/advance based on pedal strokes
    const prevCadenceRef = React.useRef(cadence);
    useEffect(() => {
        // Detect significant cadence change as a "stroke trigger"
        const diff = Math.abs(cadence - prevCadenceRef.current);
        prevCadenceRef.current = cadence;
        if (diff < 3) return; // ignore noise
        // Auto-advance every ~10 seconds of pedaling
    }, [cadence]);

    const card = deck[currentIndex % deck.length];

    const handleFlip = () => setFlipped(!flipped);

    const handleNext = () => {
        setFlipped(false);
        setCurrentIndex(i => i + 1);
        setAnswered(a => a + 1);
    };

    return (
        <div className="flashcards">
            <div className="flashcards-header">
                <span>🧠 Flashcards</span>
                <span className="flashcards-count">{answered}/{deck.length}</span>
            </div>

            <div
                className={`flashcard ${flipped ? 'flipped' : ''}`}
                onClick={handleFlip}
            >
                <div className="flashcard-inner">
                    <div className="flashcard-front">
                        <span className="flashcard-category">{card.category}</span>
                        <p className="flashcard-question">{card.question}</p>
                        <span className="flashcard-hint">Tap to reveal</span>
                    </div>
                    <div className="flashcard-back">
                        <span className="flashcard-category">{card.category}</span>
                        <p className="flashcard-answer">{card.answer}</p>
                    </div>
                </div>
            </div>

            <div className="flashcard-actions">
                <button className="flashcard-btn" onClick={handleNext}>
                    Next →
                </button>
            </div>
        </div>
    );
};
