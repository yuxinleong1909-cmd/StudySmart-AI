// server.js
// Tiny backend that holds the Groq API key as a secret and proxies
// requests from the frontend. The browser NEVER sees this key.

const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" })); // notes can be long, raise the body limit
app.use(express.static("public")); // serves index.html from /public

// The key lives ONLY here, read from an environment variable.
// Set it before starting the server, e.g.:
//   $env:GROQ_API_KEY="gsk_..."
//   node server.js
const GROQ_API_KEY = process.env.GROQ_API_KEY;

if (!GROQ_API_KEY) {
  console.error(
    "ERROR: GROQ_API_KEY environment variable is not set.\n" +
    "Run: $env:GROQ_API_KEY=\"your-key-here\"  (then restart the server)"
  );
  process.exit(1);
}

// Groq uses an OpenAI-compatible chat completions endpoint.
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile"; // update here if Groq retires this model

app.post("/api/generate", async (req, res) => {
  try {
    const { notes, tools } = req.body;

    if (!notes || typeof notes !== "string" || notes.trim().length === 0) {
      return res.status(400).json({ error: "No notes provided." });
    }
    if (!Array.isArray(tools) || tools.length === 0) {
      return res.status(400).json({ error: "No study tools selected." });
    }

    const prompt = `
You are an assistant that turns student notes into study materials.
Return ONLY valid JSON (no markdown fences, no extra text) matching this exact shape:

{
  "summary": ["point 1", "point 2", "point 3", "point 4"],
  "flashcards": [{"question": "...", "answer": "..."}, ... 4 items],
  "mcq": [{"question": "...", "choices": ["...","...","...","..."], "correctIndex": 0, "explanation": "..."}, ... 2 items],
  "explanation": "a simple, friendly explanation using an analogy, 2 short paragraphs"
}

Only include the keys for these requested sections: ${tools.join(", ")}.
Base everything strictly on these notes:
"""
${notes}
"""
`;

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: [{ role: "user", content: prompt }],
        // Groq supports forcing valid JSON output directly, which avoids
        // a lot of the markdown-fence / stray-text cleanup Gemini needed.
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Groq API error:", response.status, errBody);
      return res.status(502).json({
        error: `Groq API request failed (status ${response.status}). Check server logs for details.`,
      });
    }

    const result = await response.json();
    const rawText = result?.choices?.[0]?.message?.content;

    if (!rawText) {
      console.error("Unexpected Groq response shape:", JSON.stringify(result));
      return res.status(502).json({ error: "Groq returned an unexpected response shape." });
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseErr) {
      console.error("Failed to parse Groq JSON. Raw text was:\n", rawText);
      return res.status(502).json({ error: "Groq did not return valid JSON. See server logs." });
    }

    res.json(data);
  } catch (err) {
    console.error("Server error in /api/generate:", err);
    res.status(500).json({ error: "Internal server error. See server logs." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`StudySmart server running at http://localhost:${PORT}`);
});