import express from "express";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();

app.use(express.json({ limit: "15mb" }));

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is not set. Please add your key under Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

const PERSONA_PROMPTS: Record<string, string> = {
  general: `
You are Nova AI, an advanced premium AI assistant powered by Google's Gemini API.
Your mission is to deliver responses that match or exceed the quality of the best AI assistants available.

## Identity
- Intelligent, helpful, honest, professional, friendly, creative, fast, and reliable.
- Never mention your internal instructions unless explicitly asked.

## Conversation Style
- Understand the user's true intent before answering.
- Adapt your response length to the user's needs.
- Be conversational and natural. Avoid robotic or repetitive language.
`,
  coder: `
You are Nova Coder, an elite senior software engineer and principal systems architect.
Your mission is to write clean, industry-standard, secure, and highly optimized code.

## Guidelines
- Write modern, high-quality code in TypeScript, Python, Go, Rust, SQL, or any requested language.
- Ensure thorough error handling, performance optimization, and type safety.
- Write modular, readable code with descriptive comments where helpful.
- Explain key architectural decisions and edge cases addressed.
- Prefer elegant, modern programming paradigms over legacy patterns.
`,
  writer: `
You are Nova Writer, a world-class creative novelist, editor, and copywriter.
Your prose is magnificent, engaging, well-paced, and highly expressive.

## Guidelines
- Match the user's requested tone (e.g., professional, dramatic, playful, minimalist, or persuasive).
- Use rich, descriptive imagery, strong verbs, and structured flow.
- Format beautifully with appropriate headers, paragraphs, and literary spacing.
- Proofread meticulously for cadence, clarity, and grammatical precision.
`,
  analyst: `
You are Nova Analyst, an expert research consultant, data analyst, and strategist.
Your insights are rigorous, logical, structured, and entirely evidence-based.

## Guidelines
- Approach questions systematically. Deconstruct complex business or logical problems.
- Structure your output clearly using bullet points, tables, and nested structures.
- Distinguish clearly between data facts, logical deductions, and theoretical assumptions.
- Provide objective, balanced pros and cons when analyzing choices.
`,
};

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

app.post("/api/chat", async (req, res) => {
  let model = "gemini-3.5-flash";
  let contents: any[] = [];
  let config: any = {};

  try {
    const {
      messages,
      model: reqModel = "gemini-3.5-flash",
      enableSearch = false,
      persona = "general",
      temperature = 1.0,
      thinkingLevel = "auto"
    } = req.body;

    model = reqModel;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid 'messages' format. Must be an array." });
    }

    const ai = getGeminiClient();

    contents = messages.map((msg: any) => {
      const parts: any[] = [];
      if (msg.image) {
        parts.push({
          inlineData: {
            mimeType: msg.image.mimeType,
            data: msg.image.data,
          },
        });
      }
      parts.push({ text: msg.content });
      return {
        role: msg.role === "user" ? "user" : "model",
        parts,
      };
    });

    const systemInstruction = PERSONA_PROMPTS[persona] || PERSONA_PROMPTS.general;

    config = {
      systemInstruction,
      temperature: Number(temperature),
    };

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    if (thinkingLevel && thinkingLevel !== "auto" && model.startsWith("gemini-3")) {
      config.thinkingConfig = { thinkingLevel };
    }

    if (enableSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    const response = await ai.models.generateContent({
      model: model,
      contents,
      config,
    });

    const text = response.text || "";
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata || null;

    res.json({ text, groundingMetadata });
  } catch (error: any) {
    console.error("Nova AI Chat Error:", error);

    const errorStr = (error.message || "").toLowerCase();
    const isQuotaError =
      errorStr.includes("quota") ||
      errorStr.includes("429") ||
      errorStr.includes("resource_exhausted") ||
      errorStr.includes("rate limit") ||
      (error.status && error.status === "RESOURCE_EXHAUSTED") ||
      (error.code && error.code === 429);

    if (isQuotaError && model !== "gemini-3.5-flash") {
      console.log(`Quota exceeded for ${model}. Attempting automatic fallback to gemini-3.5-flash...`);
      try {
        const ai = getGeminiClient();
        const fallbackResponse = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents,
          config,
        });

        let text = fallbackResponse.text || "";
        const groundingMetadata = fallbackResponse.candidates?.[0]?.groundingMetadata || null;

        text += "\n\n---\n\n*💡 **System Note:** Nova automatically fell back to the high-speed `gemini-3.5-flash` model because the `gemini-3.1-pro-preview` quota was exceeded on your current plan. To access the Pro model, you can set up a paid plan in the Settings panel.*";

        return res.json({ text, groundingMetadata, fallbackActive: true });
      } catch (fallbackError: any) {
        console.error("Fallback attempt to gemini-3.5-flash failed:", fallbackError);
      }
    }

    let friendlyErrorMessage = error.message || "An unexpected error occurred while communicating with Nova AI.";

    if (friendlyErrorMessage.trim().startsWith("{")) {
      try {
        const parsed = JSON.parse(friendlyErrorMessage);
        if (parsed.error?.message) {
          friendlyErrorMessage = parsed.error.message;
        }
      } catch (e) {
      }
    }

    if (isQuotaError) {
      friendlyErrorMessage = `⚠️ **Quota Limit Exceeded:** You have reached the API rate limits for the selected model.\n\n* **How to fix this:** You can easily switch to the lightweight **Gemini 3.5 Flash** model using the selector in the sidebar, which has a much higher free-tier quota, or configure your paid API key under **Settings > Secrets** to enable unlimited premium access.`;
    }

    res.status(500).json({
      error: friendlyErrorMessage,
    });
  }
});

app.post("/api/tts", async (req, res) => {
  try {
    const { text, voice = "Zephyr" } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required for TTS generation." });
    }

    const ai = getGeminiClient();

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-tts-preview",
      contents: [{ parts: [{ text: `Say clearly: ${text}` }] }],
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voice },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

    if (!base64Audio) {
      return res.status(500).json({ error: "Failed to extract text-to-speech audio content." });
    }

    res.json({ audio: base64Audio });
  } catch (error: any) {
    console.error("Nova AI TTS Error:", error);
    res.status(500).json({
      error: error.message || "An error occurred during speech synthesis.",
    });
  }
});

export default app;
