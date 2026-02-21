/**
 * Mock Data Services
 *
 * Provides realistic mock data for news and startups.
 * Used when RSS feeds are unreachable or in development.
 */

import { NewsItem, StartupInfo } from '../types';

// ─── News Mock Data ───

const NEWS_ITEMS: NewsItem[] = [
    {
        id: '1', title: 'OpenAI Announces GPT-5 with Reasoning Breakthrough',
        source: 'TechCrunch', url: '#', publishedAt: '2 min ago',
        category: 'ai', summary: 'The new model shows unprecedented performance on complex reasoning benchmarks, marking a significant leap forward.',
    },
    {
        id: '2', title: 'NVIDIA Earnings Crush Estimates — Data Center Revenue Up 150%',
        source: 'Bloomberg', url: '#', publishedAt: '15 min ago',
        category: 'tech', summary: 'Driven by AI chip demand, NVIDIA reports record revenue of $35.1B for the quarter.',
    },
    {
        id: '3', title: 'Bitcoin Breaks $100K Resistance After ETF Inflows Surge',
        source: 'CoinDesk', url: '#', publishedAt: '32 min ago',
        category: 'crypto', summary: 'Institutional buying through spot ETFs pushes Bitcoin past the psychological $100,000 mark.',
    },
    {
        id: '4', title: 'Y Combinator W26 Batch Spotlight: AI Agents for Enterprise',
        source: 'Hacker News', url: '#', publishedAt: '1 hr ago',
        category: 'startup', summary: 'This batch features 15+ startups building autonomous AI agents for workflow automation.',
    },
    {
        id: '5', title: 'Apple Vision Pro 2 Leaked — Thinner Design, M5 Chip',
        source: 'The Verge', url: '#', publishedAt: '2 hr ago',
        category: 'tech', summary: 'Leaked schematics show a 40% thinner form factor with the upcoming M5 chip and improved pass-through cameras.',
    },
    {
        id: '6', title: 'DeepMind Releases Gemini 3.0 — Multimodal AI Goes Open Source',
        source: 'Ars Technica', url: '#', publishedAt: '3 hr ago',
        category: 'ai', summary: 'Google DeepMind open-sources Gemini 3.0, enabling developers to build multimodal applications with unprecedented capability.',
    },
    {
        id: '7', title: 'Solana DeFi TVL Hits $20B — Ethereum Killer or Complement?',
        source: 'The Block', url: '#', publishedAt: '4 hr ago',
        category: 'crypto', summary: 'Solana ecosystem growth continues as total value locked in DeFi protocols reaches a new all-time high.',
    },
    {
        id: '8', title: 'Stripe Acquires AI Fintech Startup for $2.1B',
        source: 'Reuters', url: '#', publishedAt: '5 hr ago',
        category: 'startup', summary: 'The payments giant acquires an AI-powered fraud detection startup, signaling deeper AI integration.',
    },
    {
        id: '9', title: 'EU AI Act Implementation Begins — What Startups Need to Know',
        source: 'Wired', url: '#', publishedAt: '6 hr ago',
        category: 'ai', summary: 'The European Union begins enforcement of its landmark AI regulation, creating compliance requirements for AI companies.',
    },
    {
        id: '10', title: 'Andreessen Horowitz Raises $6.5B AI Fund',
        source: 'Fortune', url: '#', publishedAt: '7 hr ago',
        category: 'startup', summary: 'a16z raises its largest AI-focused fund, targeting foundational model companies and AI-native applications.',
    },
];

export function getNewsItems(): NewsItem[] {
    return NEWS_ITEMS;
}

// ─── Startup Mock Data ───

const STARTUPS: StartupInfo[] = [
    {
        name: 'Cognify AI',
        tagline: 'Autonomous AI agents for enterprise workflows',
        description: 'Cognify builds AI agents that automate complex business processes end-to-end. Their platform integrates with existing tools like Salesforce, SAP, and Slack to handle multi-step workflows without human intervention.',
        founded: '2024',
        funding: 'Series A — $28M (Sequoia)',
        competitors: ['UiPath', 'Automation Anywhere', 'Adept AI'],
        category: 'AI Automation',
    },
    {
        name: 'NeonDB',
        tagline: 'Serverless Postgres for the AI era',
        description: 'Neon provides serverless, autoscaling Postgres with branching and instant provisioning. Used by AI companies for vector storage and real-time analytics with built-in pgvector support.',
        founded: '2022',
        funding: 'Series B — $104M (Menlo Ventures)',
        competitors: ['Supabase', 'PlanetScale', 'CockroachDB'],
        category: 'Infrastructure',
    },
    {
        name: 'Synthflow',
        tagline: 'AI voice agents for customer support',
        description: 'Synthflow creates hyper-realistic AI phone agents that handle inbound and outbound calls. Their models understand context, emotions, and can resolve 85% of support tickets without escalation.',
        founded: '2023',
        funding: 'Seed — $7.4M (a16z)',
        competitors: ['Bland AI', 'Retell AI', 'Vapi'],
        category: 'Conversational AI',
    },
    {
        name: 'LightMatter',
        tagline: 'Photonic chips for AI inference',
        description: 'LightMatter builds optical interconnects and photonic processors that run AI models 10x faster at 90% less power consumption. Their Passage chip enables wafer-scale AI accelerators.',
        founded: '2017',
        funding: 'Series D — $400M ($3.5B valuation)',
        competitors: ['Cerebras', 'Groq', 'SambaNova'],
        category: 'AI Hardware',
    },
    {
        name: 'RunwayML',
        tagline: 'AI-powered video generation & editing',
        description: 'Runway offers Gen-3 Alpha, a foundation model for video generation. Filmmakers and studios use it to create cinematic footage from text prompts, revolutionizing post-production workflows.',
        founded: '2018',
        funding: 'Series D — $141M ($4B valuation)',
        competitors: ['Pika Labs', 'Sora (OpenAI)', 'Kling'],
        category: 'Creative AI',
    },
];

export function getStartups(): StartupInfo[] {
    return STARTUPS;
}
