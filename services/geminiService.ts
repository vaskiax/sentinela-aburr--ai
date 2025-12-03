import { GoogleGenAI, Type } from "@google/genai";
import { CriminalProfile, CriminalRank, Organization } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

// System instruction strictly for Entity Recognition (NER)
// This service does NOT predict violence. It only parses raw text into structured data.
const NLP_INSTRUCTION = `
You are a specialized NLP Entity Extractor for a Criminology Database.
Your ONLY job is to extract structured entities (Alias, Organization, Rank, Locations) from raw intelligence text.
Do NOT predict outcomes. Do NOT answer questions.
Map the entities to the predefined Enums strictly.
If a field is missing, infer "Unknown" or "Independiente".
`;

export const extractCriminalFeatures = async (text: string): Promise<CriminalProfile> => {
  if (!apiKey) throw new Error("API Key not found");

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `EXTRACT ENTITIES FROM REPORT:\n\n"${text}"`,
    config: {
      systemInstruction: NLP_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          alias: { type: Type.STRING },
          rank: { type: Type.STRING, enum: Object.values(CriminalRank) },
          organization: { type: Type.STRING, enum: Object.values(Organization) },
          territory_influence: { type: Type.ARRAY, items: { type: Type.STRING } },
          status: { type: Type.STRING, enum: ['CAPTURED', 'NEUTRALIZED', 'ACTIVE'] },
          capture_date: { type: Type.STRING },
        },
        required: ['alias', 'rank', 'organization', 'status', 'territory_influence']
      }
    }
  });

  const jsonText = response.text || "{}";
  return JSON.parse(jsonText) as CriminalProfile;
};