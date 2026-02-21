# Stock Rider — Complete Strategic & Implementation Plan

> **From "Stock Rider" to a new breed of indoor cycling app: exercise your body AND your mind.**

---

## 1. Vision & Positioning

### The Problem
Busy founders, professionals, and knowledge workers skip sports because it feels like "wasted time." Every hour on a bike trainer is an hour NOT spent learning, networking, or building. Indoor cycling apps (Zwift, MyWhoosh, Rouvy) only offer virtual worlds — entertainment, not productivity.

### The Solution  
**Stock Rider** reframes indoor cycling as a **productive investment**. Instead of virtual scenery, you ride through **real-world knowledge**: live market data, tech news, AI breakthroughs, podcast summaries, and even your own business dashboards. Every ride makes you fitter AND smarter.

### Tagline Options
- **"Ride Smart. Learn While You Burn."** ← current, strong
- **"Your body works out. Your mind levels up."**
- **"The only cycling app that makes you money while you sweat."**

---

## 2. Target Audience

| Segment | Size | Why They Care |
|---|---|---|
| **Founders & CEOs** (primary) | ~5M globally | Guilt-free exercise — stay informed while training |
| **Tech professionals** | ~30M | Already into self-optimization, biohacking culture |
| **Finance/crypto traders** | ~10M | Watch markets while burning calories |
| **Busy parents** | ~50M potential | Limited time — double-dip on sport + learning |
| **Content creators** | ~2M | OBS overlay mode → cycling + commentary = unique format |

### Ideal User Persona: **"Adrian"**
- Founder of an AI startup
- Owns a Wahoo KICKR, never uses it because "no time"
- Checks crypto and tech news 20x/day anyway
- Wants to make demo videos that look unique

---

## 3. Competitive Landscape

| App | Price | Focus | Our Advantage |
|---|---|---|---|
| **Zwift** | $15/mo | Virtual world racing | We're productive, not gamified |
| **MyWhoosh** | Free | Virtual worlds, eRacing, UCI events | We don't compete on graphics — we compete on VALUE of time |
| **TrainerRoad** | $20/mo | Structured training plans | We combine training with knowledge consumption |
| **Rouvy** | $15/mo | Real-road video | We use real DATA, not real video |
| **Peloton** | $13/mo | Instructor-led classes | We're self-directed and builder-oriented |

> [!IMPORTANT]
> **We do NOT compete with these apps.** We complement them. Many users will use Zwift for group rides AND Stock Rider for solo "productive" sessions. Our positioning is unique: **the first "productive cycling" app.**

---

## 4. Monetization Strategy

### Recommended: **Freemium + Pro**

| Tier | Price | Includes |
|---|---|---|
| **Free** | $0 | Basic ride, mock data, 3D scene limited, 2 data feeds |
| **Pro** | $7.99/mo or $59/yr | All live data feeds, custom dashboards, ride analytics, OBS overlay, podcast integration, API access |
| **Team** (future) | $29/mo | Company dashboards while riding, team challenges, Slack integration |

### Why not fully free like MyWhoosh?
MyWhoosh is backed by UAE government money. We're bootstrapped. $7.99/mo is impulse-buy territory and positions us as premium. The free tier creates virality; Pro creates revenue.

### Additional Revenue Streams
1. **YouTube content** → brand deals, sponsorships (cycling + tech crossover niche)
2. **Affiliate links** → crypto exchanges, trading platforms shown in-app
3. **White-label** → companies wanting branded "ride & learn" for team building
4. **Data partnerships** → anonymized fitness/engagement data (later, with consent)

---

## 5. Feature Roadmap

### Phase 1: MVP Polish ✅
- [x] 3D cyberpunk rider scene with data billboards
- [x] Mock BLE service with realistic data
- [x] 2D dashboard with crypto, stocks, news
- [x] HUD overlay for 3D view
- [x] **Wire up real BLE connect** (toggle mock vs real in Settings)
- [x] **Real API data** — CoinGecko (free), RSS feeds via rss2json
- [x] **Podcast/Audio player** — compact HUD mode + full AUDIO tab
- [x] **Session summary** — stats + knowledge consumed + share + Strava export
- [x] **Landing page** — hero, features, pricing ($7.99 Pro), waitlist
- [x] **PWA manifest** + OG meta tags + SEO

### Phase 2: Content Engine ✅
- [ ] **AI-curated content feed** — use piwi.ai to summarize articles (future: needs backend)
- [ ] **"Ride Planner"** — schedule content before a ride (future)
- [x] **Flashcard mode** — 12-card business/tech/AI deck with 3D flip (LEARN tab)
- [x] **OBS Overlay mode** — transparent background (toggle in Settings)
- [x] **Strava export** — .TCX file download on session summary
- [x] **HR zone display** — colored zone bar with needle in dashboard
- [x] **Voice briefing** — TTS reads headlines (toggle in Settings)
- [x] **Settings panel** — BLE, data, feeds, voice, OBS, founder mode
- [x] **Ride history** — localStorage with lifetime totals

### Phase 3: Social & Growth ✅
- [x] **Session sharing** — Web Share API + clipboard fallback
- [ ] **Leaderboards** — watts/km + knowledge consumed (future: needs backend)
- [x] **Custom data sources** — add any RSS feed in Settings
- [x] **Founder Mode** — company metrics widget (MRR, DAU, etc.)
- [x] **Voice briefing** — TTS reads news headlines while you ride
- [ ] **Multi-language** support (future)

### Phase 4: Platform (Future)
- [ ] **Marketplace** — content channels (e.g., "YC Startup channel," "Crypto alpha channel")
- [ ] **Team/Company plans** — ride together, learn together
- [ ] **API for extensions** — developers build custom data panels
- [ ] **Mobile companion app** — control from phone, see ride stats
- [ ] **Apple Watch / Garmin** integration

---

## 6. Marketing & Growth Strategy

### Launch Strategy: **"Founder Riding" YouTube Series**

> [!TIP]
> Adrian (you) records rides where you discuss piwi.ai updates, AI news, and startup insights. The 3D cyber ride scene is the unique visual hook. Each video promotes the app.

#### Channel 1: **YouTube (Primary)**
- Weekly 20-30 min ride videos: "I built an AI feature while cycling"
- Format: Split-screen — face cam + Stock Rider 3D scene + code/demo
- Target keywords: "productive cycling," "learn while exercising," "founder fitness"
- Expected growth: 1K subs month 1, 10K by month 6 (niche but loyal)

#### Channel 2: **Twitter/X (Tech community)**  
- Daily ride stats + what you learned: "45 min / 620 kcal / 3 AI papers summarized"
- GIF/video clips of the 3D ride scene (eye-catching)
- Tag influential founders, indie hackers

#### Channel 3: **Product Hunt Launch**
- Target: Top 5 Product of the Day
- Unique angle: "The cycling app that makes you smarter"
- Prepare: demo video, beautiful screenshots, landing page

#### Channel 4: **Hacker News / Reddit**
- "Show HN: I built a cycling app that feeds you live market data"
- Cross-post to r/cycling, r/zwift, r/quantifiedself, r/productivity

#### Channel 5: **Partnerships**
- Smart trainer brands (Wahoo, Tacx) — featured app
- Cycling podcasts — guest spots
- Startup incubators — "wellness for founders" program

### Viral Mechanics
1. **Session cards** — auto-generated shareable images: ride stats + knowledge highlights
2. **"I learned X while cycling Y km"** social format
3. **Referral program** — invite 3 friends → 1 month Pro free

---

## 7. Open Source Decision

> [!IMPORTANT]
> **Recommendation: Open-source the core, monetize the platform.**

| Component | License | Rationale |
|---|---|---|
| **BLE/FTMS library** | MIT | Grow community, get contributions, become the standard |
| **3D scene engine** | MIT | Visual showcase drives awareness |
| **Data feed connectors** | MIT | Let devs extend with custom feeds |
| **Pro features** | Proprietary | AI curation, analytics, OBS overlay, sync integrations |
| **Backend/infra** | Proprietary | Session storage, user accounts, API keys |

### Why?
- **Builds trust** — open-source cycling tool → community contributions → better product
- **Moat is in the platform**, not the code (AI curation, content partnerships, UX polish)
- **GitHub stars = marketing** — developers discover you, try the app, convert to Pro
- **Recruitment** — shows technical chops for piwi.ai hiring pipeline

---

## 8. Rebranding Consideration

> [!WARNING]  
> **"Stock Rider" may be too narrow.** If the vision is "learn anything while cycling" (not just stocks), consider a name that scales:

| Option | Vibe | Domain Check Needed |
|---|---|---|
| **RideWise** | Wisdom + cycling | Short, memorable |
| **PedalMind** | Body + brain | Unique |
| **CycleIQ** | Intelligence + cycling | Professional |
| **VeloLearn** | European cycling culture + learning | Niche |
| **Stock Rider** (keep) | Financial focus, already established | May limit positioning |

**Recommendation**: Keep "Stock Rider" for MVP launch. Rebrand when expanding beyond financial data (Phase 2-3). The financial data angle is the sharpest initial wedge.

---

## 9. Proposed Technical Changes (Code)

### Phase 1 Implementation Details

---

#### Data Services — Real API Integration

##### [MODIFY] [mockData.ts](file:///Users/work/stock-rider/src/services/mockData.ts)
- Rename to `dataService.ts`
- Replace mock functions with real API calls: CoinGecko REST (no key needed), free news RSS via CORS proxy
- Keep mock fallback for offline/dev mode

##### [NEW] [apiConfig.ts](file:///Users/work/stock-rider/src/services/apiConfig.ts)
- API endpoints, keys, polling intervals
- Environment-based config (dev = mock, prod = live)

---

#### BLE Improvements

##### [MODIFY] [bleService.ts](file:///Users/work/stock-rider/src/services/bleService.ts)
- Add toggle in UI to switch mock/real
- Add reconnection logic with exponential backoff
- Emit connection quality metrics

---

#### New Features

##### [NEW] [SessionSummary.tsx](file:///Users/work/stock-rider/src/components/SessionSummary.tsx)
- End-of-ride screen: duration, calories, distance, content consumed
- Shareable card generation (canvas → PNG)

##### [NEW] [PodcastPlayer.tsx](file:///Users/work/stock-rider/src/components/PodcastPlayer.tsx)
- Minimal audio player for podcasts/music during rides
- Controls in HUD overlay

##### [NEW] [LandingPage.tsx](file:///Users/work/stock-rider/src/components/LandingPage.tsx)
- Entry point before the ride: hero, features, demo video embed, "Start Ride" CTA
- Email waitlist signup (ConvertKit or simple Formspree)

##### [MODIFY] [App.tsx](file:///Users/work/stock-rider/src/App.tsx)
- Add landing page as default view
- Add session summary view after ride end
- Add settings panel (mock/real BLE, feed selection)

##### [NEW] [manifest.json](file:///Users/work/stock-rider/public/manifest.json)  
- PWA manifest for tablet/phone install

---

#### Polish

##### [MODIFY] [index.css](file:///Users/work/stock-rider/src/index.css)
- Add landing page styles
- Add session summary styles
- Import Google Fonts (Inter, JetBrains Mono) properly

##### [MODIFY] [index.html](file:///Users/work/stock-rider/index.html)
- Add meta tags (SEO, Open Graph for social sharing)
- Add PWA manifest link
- Add favicon

---

## 10. Verification Plan

### Automated Tests
- **Existing tests**: `src/__tests__/cyclist-geometry.test.ts`, `visual-properties.test.ts`, `wheel-rotation.test.ts`
- Run with: `npx vitest run`
- Add new test: `dataService.test.ts` — verify API response parsing, fallback to mock on error

### Manual Verification
1. **Dev server**: `npm run dev` → verify landing page loads, "Start Ride" navigates to 3D view
2. **BLE toggle**: In settings, switch to "Real BLE" → Chrome requests device pairing
3. **API data**: Open Network tab → verify CoinGecko calls succeed, news feed populates
4. **PWA**: In Chrome → hamburger menu → "Install Stock Rider" → opens as standalone app
5. **Session summary**: Ride for 2+ minutes → click "End Ride" → verify summary card with stats
6. **Responsive**: Test at laptop (1440px), tablet (768px), phone (375px) breakpoints

### Production Build
- `npm run build` — verify zero TypeScript errors, bundle size < 500KB (excl. Three.js)
