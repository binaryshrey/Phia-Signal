# Phia Signal - Demo Script

---

## Hook

> What if your phone knew your style better than you do?

Every day, millions of people scroll through thousands of products they'll never wear. The fashion industry throws everything at you and hopes something sticks. But style isn't random. It's deeply personal — shaped by your body, your skin, your taste, and the version of yourself you want to be.

**What if there was an AI that actually understood that?**

---

## The Problem

Online shopping is broken.

- You spend hours scrolling through items that don't fit your body or match your skin tone.
- You order clothes that look nothing like they did on the model.
- You have no idea if something will actually work until it shows up at your door.
- Your friends' opinions come too late — after you've already bought it.

The result? Returns, regret, and a closet full of things you never wear.

---

## The Solution

**Phia Signal.**

> *Philosophy of discovering your signature style as insignia.*

Phia is an AI-powered style intelligence platform that learns who you are — your body, your complexion, your vibe — and builds a living, breathing style profile that gets smarter with every interaction.

---

## The Experience

### 1. Onboarding — Phia Learns You

The moment you arrive, Phia's voice agent welcomes you and walks you through a guided onboarding:

- **Upload your photos** — selfies, full-body shots, and outfit references. Upload once, and Phia's AI automatically distributes them across categories.
- **AI-detected skin tone** — Phia analyzes your selfie to determine your complexion, which drives outfit color palette recommendations.
- **Body-detected sizing** — Full-body photos are analyzed to estimate your clothing size and pant size — pre-filled and ready to adjust.
- **Outfit analysis** — Your outfit photos are scanned to auto-detect your style vibes, favorite colors, and preferred fabrics.
- **Patterns to avoid** — Select patterns you don't want (florals, stripes, animal print, neon) so Phia never recommends them.
- **Celebrity Watchlist** — Pick celebrities whose style you admire — Jasmine Tookes, Zendaya, Paris Hilton, and more. Phia uses their aesthetic as style signals.
- **Instagram import** — Optionally pull your style from your Instagram feed.

Every preference is saved and feeds into Phia's learning engine.

---

### 2. Phia Signal — The Agent Orchestrator

As the app launches, Phia Signal powers up. This is the brain behind the experience — an **AI agent orchestrator** that deploys multiple specialized agents in parallel:

| Agent | Role |
|---|---|
| **Style Agent** | Analyzes your style preferences, vibes, and color palette to curate recommendations |
| **Discovery Agent** | Curates your personalized feed from thousands of products, filtered through your profile |
| **Try-On Agent** | Generates virtual try-on images using your photos and celebrity references |
| **Sizing Agent** | Tracks your body measurements and recommends the right size for every product |

These agents work together, connected by animated data flows visible on the canvas — each one feeding signals into the app in real-time. You can see them, move them, and watch the intelligence flow.

The **Sizing Agent** is voice-enabled — click to activate, speak your sizing updates, and Phia updates your profile automatically via ElevenLabs conversational AI.

---

### 3. The Feed — Personalized Discovery

Your Explore feed isn't generic. It's built by the Discovery Agent using signals from your entire profile:

- **Celebrity Watchlist** — horizontal carousel of your selected style icons, right at the top.
- **Curated products** — every item is filtered through your skin tone, sizing, style vibes, and color preferences.
- **Smart sizing** — each product shows dress or shoe sizes with your recommended size highlighted.
- **One-tap product details** — tap any item to see full details, pricing, brand info, and action buttons.

---

### 4. Virtual Try-On — See It On You

Every product has a **Try On** button. When you tap it:

- Phia generates virtual try-on images using your uploaded photos and your selected celebrities.
- Results appear as a swipeable carousel — your try-on first, then each celebrity wearing the same piece.
- All generated images are **cached** — open the same product later and your try-ons are instantly available.
- Tap any image to view it enlarged.

---

### 5. The Learning Loop

Every interaction teaches Phia:

- **Like or dislike** a product → your style profile updates.
- **Add to cart** → Phia learns what you're ready to buy.
- **Try on** an item → Phia understands what silhouettes work for you.
- **Browse a category** → Phia adjusts discovery weights.

The brain visualization on the Analytics page shows this in real-time — a neural mesh of **22+ learned preferences** across complexion, sizing, style, color, fabric, and brand categories. Each node lights up as Phia learns more about you.

---

### 6. Shopping Cart — Bag & Reviews

Your cart has two tabs:

**Bag** — Your saved items with try-on thumbnails, ready to purchase.

**Reviews** — A social fitting room where every cart item becomes a review card:

- **Heat Level** — a real-time percentage showing how "hot" (approved) each item is based on votes.
- **Cop / Drop voting** — thumbs up or down with live counters.
- **Image carousel** — swipe through the product photo and all generated try-on images.
- **Squad Chat** — friends leave comments and reactions on each piece.
- **AI Summary** — one tap generates a Gen-Z style summary of the squad's feedback ("bestie the squad is split on this fit fr fr...").
- **Swipe to remove** — flick left to remove items from your list.

---

### 7. Share With Your Squad

Hit the share button to send your cart to friends:

- **Copy Link** — generates a unique URL (`phia-signal.vercel.app/cart/{id}`)
- **iMessage, Telegram, Gmail** — quick-share to your preferred platform
- When shared, the **Feedback Agent** appears on the canvas — a new AI agent that collects and processes friend feedback, with animated data flowing back to the app.

---

### 8. Analytics — What Phia Learned

The Analytics dashboard visualizes everything Phia knows:

- **Face Mesh Analysis** — your uploaded selfie with MediaPipe face/hair mesh overlay, detecting skin tone, lip color, and hair color with labeled hex values.
- **Brain Node Graph** — an interactive neural visualization with 115 nodes. Each learned preference lights up a node — hover to explore. Categories: Complexion, Sizing, Style, Color, Fabric, Brand, Visual.
- **What Phia Learned About You** — categorized pills showing every detected insight: skin tone, clothing sizes, style vibes, favorite colors, selected brands, and photo analysis.

---

## The Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS 4 |
| State | Zustand (persisted to localStorage) |
| AI — Vision | Anthropic Claude Opus (skin tone, size, outfit analysis) |
| AI — Voice | ElevenLabs Conversational AI (onboarding + sizing agent) |
| AI — Try-On | Google Vertex AI (virtual-try-on-001) |
| AI — Image Gen | Google Gemini 2.5 Flash (aesthetic backgrounds) |
| Face Analysis | MediaPipe Tasks Vision (face landmarks) |
| Storage | Supabase (photo uploads) |
| Animations | GSAP ScrollTrigger, Framer Motion |
| Canvas | Custom SVG agent visualization with animated particles |

---

## One Line

**Phia Signal is an AI-powered style intelligence platform that learns your body, skin tone, and taste — then curates, fits, and styles every piece to match who you are.**

---

*Philosophy of discovering your signature style as insignia.*
