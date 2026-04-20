/**
 * Service to interact with the Groq API to orchestrate AI trip creation.
 * We use standard fetch to the Groq REST API.
 */

const MODEL = 'llama3-8b-8192';

/**
 * Calls Groq and enforces a rigid JSON response matching the database structure.
 * @param {string} prompt User's text description of the trip
 * @param {string} apiKey User's API Key from environment or settings
 */
export async function generateAITrip(prompt, apiKey) {
  if (!apiKey) throw new Error("Groq API Key is missing. Please add it to your .env file as VITE_GROQ_API_KEY.");

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

  try {
    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: systemInstruction },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" }
    };

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Groq API Error:", errText);
      throw new Error(`AI Service Failed: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    const textOutput = data.choices?.[0]?.message?.content;
    
    if (!textOutput) throw new Error("No response received from the travel agent.");

    // Parse strictly
    return JSON.parse(textOutput);

  } catch (err) {
    console.error("AI Generation Error: ", err);
    throw new Error("Failed to consult SafarPandit. " + err.message);
  }
}
