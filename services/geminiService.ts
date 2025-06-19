
import { GoogleGenAI, Chat, GenerateContentResponse, GenerateContentStreamResult, Part, Content } from "@google/genai";
import { ChatMessage, GenerateContentResponseWithGrounding } from '../types';

const API_KEY = process.env.API_KEY || ""; 
// In a real app, process.env.API_KEY would be set by the build/deployment environment.
// For local dev, you might need to replace "YOUR_API_KEY_HERE" with your actual key if not using a build tool that handles .env files.
// Or ensure your build process (e.g., Vite, Webpack) correctly substitutes process.env.API_KEY.


let ai: GoogleGenAI | null = null;
if (API_KEY && API_KEY !== "YOUR_API_KEY_HERE" && API_KEY.length > 10) {
  try {
    ai = new GoogleGenAI({ apiKey: API_KEY });
  } catch (error) {
    console.error("Failed to initialize GoogleGenAI:", error);
    ai = null;
  }
} else {
  console.warn("Gemini API key is missing or placeholder. Gemini functionality will be disabled.");
}

const TEXT_MODEL = 'gemini-2.5-flash-preview-04-17';

export const createChatSession = (history?: ChatMessage[]): Chat | null => {
  if (!ai) return null;
  
  const formattedHistory: Content[] = history ? history.map(msg => ({
    role: msg.role === 'system' ? 'model' // System messages are often treated as model instructions preceding user messages
          : (msg.role as 'user' | 'model'), // Type assertion
    parts: [{ text: msg.text }] as Part[]
  })) : [];

  return ai.chats.create({
    model: TEXT_MODEL,
    history: formattedHistory,
    config: {
      systemInstruction: 'You are PhillOS AI CoPilot, a helpful and concise assistant integrated into an AI-native operating system. Respond in markdown format when appropriate for lists, code blocks, etc.',
      // For low latency if needed: thinkingConfig: { thinkingBudget: 0 }
      // For higher quality, omit thinkingConfig or set it higher.
    },
  });
};

export const sendMessageToChatStream = async (
  chat: Chat,
  message: string
): Promise<GenerateContentStreamResult | null> => {
  if (!ai) return null;
  try {
    return await chat.sendMessageStream({ message });
  } catch (error) {
    console.error("Error sending message to chat stream:", error);
    throw error; // Re-throw to be handled by the caller
  }
};

export const generateTextWithGoogleSearch = async (
  prompt: string
): Promise<GenerateContentResponseWithGrounding | null> => {
  if (!ai) {
    console.warn("Gemini API not initialized. Cannot generate text.");
    return { text: "Gemini API not available. Please configure API Key.", candidates: [] };
  }
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL,
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    // The type cast is to satisfy our custom GenerateContentResponseWithGrounding
    return response as GenerateContentResponseWithGrounding;
  } catch (error) {
    console.error("Error generating text with Google Search:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return { text: `Error: ${errorMessage}`, candidates: [] };
  }
};


// Helper to parse JSON, removing markdown fences if present
export const parseJsonFromString = <T,>(jsonString: string): T | null => {
  let cleanJsonString = jsonString.trim();
  const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
  const match = cleanJsonString.match(fenceRegex);
  if (match && match[2]) {
    cleanJsonString = match[2].trim();
  }

  try {
    return JSON.parse(cleanJsonString) as T;
  } catch (e) {
    console.error("Failed to parse JSON response:", e, "Original string:", jsonString);
    return null;
  }
};
