# Voice Command Shopping Assistant 🛒🎙️

> **Technical Assessment Submission — Software Engineer Position**  
> A voice-first smart shopping list manager featuring Google Gemini NLP intent parsing, predictive reorder suggestions, voice search filtering, and Flipkart-inspired UI.

---

## 📝 Candidate Submission Writeup (200 Words Max)

> **Approach & Architecture Summary:**  
> The Voice Command Shopping Assistant is designed as a resilient, voice-first e-commerce companion. The core architecture uses the browser's native **Web Speech API** for zero-latency speech-to-text, paired with **Google Gemini AI** for structured Natural Language Processing (NLP). Instead of unstructured text generation, Gemini normalizes complex, multi-lingual voice commands (English, Hindi, Gujarati, Spanish, French) into strict JSON domain intents (`ADD_ITEM`, `REMOVE_ITEM`, `SEARCH_PRODUCTS`, `FILTER_PRICE`). 
> 
> Product data, user list state, and purchase history reside in **Supabase PostgreSQL**. Smart suggestions leverage purchase frequency telemetry to provide explainable reorders (e.g., *"Bought 8 times recently; reorder target hit"*), alongside seasonal picks and health substitutes. Voice-activated search allows granular natural language queries such as *"Find toothpaste under $5"*. 
> 
> Built with **Next.js 14**, **TypeScript**, and **Tailwind CSS**, the UI adopts a Flipkart-inspired aesthetic with rich visual feedback, audio speech synthesis confirmations, real-time waveform visualizers, and offline state fallbacks. API credentials (`GEMINI_API_KEY`, `SUPABASE_SECRET_KEY`) strictly reside in server-side routes and `.env.local` to prevent client-side exposure.

---

## ✨ Core Features

### 1. 🎙️ Natural Voice Input & Multilingual NLP
- **Voice Command Parsing**: Automatically recognizes varied phrasing (e.g., *"Add milk"*, *"I need 2 kg gala apples"*, *"Remove bread"*).
- **Multilingual Support**: Supports commands in English (`en-IN`), Hindi (`hi-IN`: *"दूध और दो किलो सेब जोड़ो"*), Gujarati (`gu-IN`: *"બે કિલો સફરજન ઉમેરો"*), Spanish, and French.
- **Audio Feedback**: Built-in Speech Synthesis (`speechSynthesis`) gives verbal confirmations.

### 2. 💡 Smart Reorder & Seasonal Suggestions
- **Predictive Recommendations**: Analyzes reorder intervals and alerts users when staples are running low with explicit reasoning tags.
- **Seasonal Highlights**: Flipkart-styled promotional banners for peak seasonal items (e.g. Fresh Ratnagiri Alphonso Mangoes).
- **Smart Substitutes**: Recommends healthier or alternative options (e.g. Organic Almond Milk or Soy Milk for regular milk).

### 3. 🔍 Voice-Activated Search & Filter Engine
- **Granular Filters**: Search products by brand, category, organic tags, and maximum price (e.g., *"Find organic apples under $5"*).
- **Interactive Catalogue**: Live category tabs and price ceiling sliders.

### 4. 🛒 Category-Grouped Shopping List
- Auto-groups items into **Produce**, **Dairy**, **Bakery**, **Beverages**, **Snacks**, **Pantry**, **Household**, and **Personal Care**.
- Stepper quantity controls (`+` / `-`), completed check toggles, estimated total calculation, and confetti celebration on completion.

---

## 🏗️ System Architecture

```
                                  ┌───────────────────────────┐
                                  │   Flipkart-Inspired UI    │
                                  │   Next.js 14 / Tailwind   │
                                  └─────────────┬─────────────┘
                                                │
                                    Speech      │      TTS Audio
                                  Transcripts   │      Feedback
                                                ▼
                                  ┌───────────────────────────┐
                                  │    Browser Web Speech     │
                                  │   SpeechRecognition API   │
                                  └─────────────┬─────────────┘
                                                │ transcript
                                                ▼
                                  ┌───────────────────────────┐
                                  │  Next.js Server API Route │
                                  │       /api/nlp            │
                                  └─────────────┬─────────────┘
                                                │
                                                ▼
                                  ┌───────────────────────────┐
                                  │      Google Gemini AI     │
                                  │   Structured Intent JSON  │
                                  └─────────────┬─────────────┘
                                                │ normalized intent
                                                ▼
                                  ┌───────────────────────────┐
                                  │     Supabase Postgres     │
                                  │ Database (Items/Catalog)  │
                                  └───────────────────────────┘
```

---

## 🔒 Security & Environment Setup

All API keys are protected using Next.js server-side environment variables and are excluded from source control via `.gitignore`.

Create `.env.local` in the project root:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
SUPABASE_SECRET_KEY=your_secret_key

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key
```

---

## 🚀 Running Locally

1. **Clone the repository**:
   ```bash
   git clone https://github.com/bold24-AY/Voice-command-Shopping.git
   cd Voice-command-Shopping
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🗄️ Database Setup (Supabase)

Execute `supabase/schema.sql` in your Supabase SQL Editor to create tables (`shopping_items`, `products`, `purchase_history`) and seed initial catalog items.
