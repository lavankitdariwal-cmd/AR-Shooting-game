import { GoogleGenAI, Type } from "@google/genai";
import { Mission } from "../types";

// Correctly initialize GoogleGenAI with the API key from environment variables
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateMission = async (): Promise<Mission | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: "Generate a cool, minimalist sci-fi mission name (e.g., 'VOID NULL', 'CORE ECHO') and a 12-word tactical objective about eliminating geometric anomalies in a dark sector.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            objective: { type: Type.STRING }
          },
          required: ["name", "objective"]
        }
      }
    });

    // Property access .text is the correct way to extract generated content
    const text = response.text;
    return text ? JSON.parse(text) : null;
  } catch (error) {
    console.error("Mission Generation Error:", error);
    return null;
  }
};

export const generateDebrief = async (score: number, combo: number): Promise<string | null> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `You are a minimalist, cold AI commander. The player finished a mission in a dark sector. Score: ${score}. Max Combo: ${combo}. Write a short, 1-sentence performance review using cybernetic or data-stream metaphors.`,
    });

    // Use property access .text as per guidelines
    return response.text || null;
  } catch (error) {
    console.error("Debrief Generation Error:", error);
    return null;
  }
};