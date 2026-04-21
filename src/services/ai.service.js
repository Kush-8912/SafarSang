/**
 * Service to interact with the Groq API to orchestrate AI trip creation.
 * We use standard fetch to the Groq REST API.
 */

// Prefer a currently-supported Groq model; allow override via .env
// Docs: https://console.groq.com/docs/models
const DEFAULT_MODEL = 'llama-3.1-8b-instant';

function extractFirstJsonObject(text) {
  if (!text) return null;
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  return text.slice(start, end + 1);
}

async function groqChatCompletion({ prompt, apiKey, model, useJsonMode }) {
  const url = `https://api.groq.com/openai/v1/chat/completions`;

  const systemInstruction = `
You are an expert Indian travel agent named SafarPandit.
You MUST output EXACTLY valid JSON, without markdown formatting, without code blocks like \`\`\`json, and without any trailing text.
The JSON must strictly match the following schema:
{
  "name": "Creative name for the trip (e.g. Gateway to the Himalayas)",
  "destination": "The primary city/state in India",
  "startDate": "YYYY-MM-DD (assume the trip starts exactly 1 month from today)",
  "endDate": "YYYY-MM-DD",
  "totalBudget": 50000,
  "description": "A beautiful 2 sentence description.",
  "itinerary": [
    {
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "title": "Title of the activity",
      "location": "A real location string",
      "category": "transport|accommodation|activity|food|other",
      "notes": "Brief tips or historical context"
    }
  ]
}
Design the trip to be immersive and deeply cultural.
If the prompt doesn't specify an exact duration, assume 3 days.
Make sure the start and end dates make logical sense.
`;

  const payload = {
    model,
    messages: [
      { role: "system", content: systemInstruction },
      { role: "user", content: prompt }
    ],
    temperature: 0.4,
  };

  if (useJsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(payload),
  });

  const rawText = await response.text();
  if (!response.ok) {
    // Bubble up the raw error body for easier diagnosis.
    throw new Error(`Groq API Error: ${response.status} ${response.statusText} - ${rawText}`);
  }

  const data = JSON.parse(rawText);
  const textOutput = data.choices?.[0]?.message?.content;
  if (!textOutput) throw new Error("No response received from the travel agent.");
  return textOutput;
}

/**
 * Calls Groq and enforces a rigid JSON response matching the database structure.
 * @param {string} prompt User's text description of the trip
 * @param {string} apiKey User's API Key from environment or settings
 */
export async function generateAITrip(prompt, apiKey) {
  if (!apiKey) throw new Error("Groq API Key is missing. Please add it to your .env file as VITE_GROQ_API_KEY.");

  try {
    const model = import.meta.env.VITE_GROQ_MODEL || DEFAULT_MODEL;

    // Attempt 1: JSON mode (best when supported)
    let textOutput;
    try {
      textOutput = await groqChatCompletion({ prompt, apiKey, model, useJsonMode: true });
    } catch (err) {
      // Attempt 2: fallback without JSON mode (some models/accounts reject response_format)
      console.warn("Groq JSON mode failed, retrying without response_format.", err);
      textOutput = await groqChatCompletion({ prompt, apiKey, model, useJsonMode: false });
    }

    // Parse strictly; if model adds extra text, extract the first JSON object.
    try {
      return JSON.parse(textOutput);
    } catch {
      const extracted = extractFirstJsonObject(textOutput);
      if (!extracted) throw new Error("AI returned an invalid response format.");
      return JSON.parse(extracted);
    }

  } catch (err) {
    console.error("AI Generation Error: ", err);
    throw new Error("Failed to consult SafarPandit. " + err.message);
  }
}
