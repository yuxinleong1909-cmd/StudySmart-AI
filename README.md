# StudySmart AI

Upload lecture notes (PDF, DOCX, or plain text) and instantly generate a summary, flashcards, and multiple-choice quiz questions — powered by an Express backend and the Groq API (Llama 3.3).

**Live demo:** https://studysmart-ai-1yb2.onrender.com

> ⚠️ **First load note:** this is deployed on Render's free tier, which spins down after periods of inactivity. If the link has been idle for a while, the first request can take **30–60 seconds** to wake up. This is expected — just wait for it, no need to refresh.

## What it does

1. Upload a file (PDF / DOCX / TXT) or paste notes directly into the text box
2. Pick which study materials you want: Summary, Flashcards, MCQs, and/or a simplified explanation
3. Click **Generate study materials** — the app sends your notes to an AI model and renders the results in interactive tabs
4. Flashcards flip on click/tap, MCQs reveal correct answers with explanations on selection

## Tech stack

- **Frontend:** Vanilla HTML/CSS/JS, with `pdf.js` for PDF text extraction and `mammoth.js` for DOCX parsing — all done client-side before notes ever reach the server
- **Backend:** Node.js + Express, acting as a secure proxy to the AI provider
- **AI provider:** Groq API (`llama-3.3-70b-versatile`), called server-side only
- **Hosting:** Render (free tier)

## Why there's a backend at all

The AI API key is never exposed to the browser. The frontend calls our own `/api/generate` endpoint; only the server holds the real API key, read from an environment variable. This avoids shipping a secret inside client-side code, which would be visible to anyone who viewed the page source.

## Running it locally

```bash
npm install
# Windows PowerShell:
$env:GROQ_API_KEY="your_groq_key_here"
# macOS/Linux:
export GROQ_API_KEY="your_groq_key_here"

node server.js
```

Then open `http://localhost:3000`.

Get a free Groq API key at [console.groq.com/keys](https://console.groq.com/keys).

## Known limitations

- Notes longer than ~12,000 characters are automatically truncated before being sent to the model, to stay within request size limits. A notice appears in the UI when this happens.
- Free-tier hosting means occasional cold-start delays (see note above).

## Project structure

```
StudySmart-AI/
├── server.js           # Express backend, proxies requests to Groq
├── package.json
└── public/
    └── index.html       # Frontend UI (upload, tabs, flashcards, MCQs)
```
