import { GoogleGenAI, Type } from "@google/genai";

export interface StreamChunkHandler {
  (textDelta: string): void;
}

export interface GenerateOptions {
  apiKey: string;
  userText: string;
  systemPrompt: string;
}

export class AiService {
  private static instance: AiService;

  private constructor() {}

  public static getInstance(): AiService {
    if (!AiService.instance) {
      AiService.instance = new AiService();
    }
    return AiService.instance;
  }

  public async streamGenerate(
    options: GenerateOptions,
    onChunk: StreamChunkHandler
  ): Promise<string> {
    const { apiKey, userText, systemPrompt } = options;
    if (!apiKey) {
      throw new Error("Missing Gemini API key");
    }

    const ai = new GoogleGenAI({ apiKey });

    const config = {
      thinkingConfig: { thinkingBudget: -1 },
      systemInstruction: systemPrompt,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        required: ["title", "friendly_message", "userscript", "urlmatch"],
        properties: {
          title: { type: Type.STRING },
          friendly_message: { type: Type.STRING },
          userscript: { type: Type.STRING },
          urlmatch: { type: Type.STRING },
        },
        propertyOrdering: [
          "friendly_message",
          "userscript",
          "title",
          "urlmatch",
        ],
      },
    };

    const model = "gemini-2.5-flash-lite";
    const contents = [
      {
        role: "user" as const,
        parts: [
          {
            text: userText,
          },
        ],
      },
    ];

    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullText = "";
    for await (const chunk of response) {
      const delta = chunk.text ?? "";
      if (delta) {
        fullText += delta;
        onChunk(delta);
      }
    }
    return fullText;
  }
}

export const aiService = AiService.getInstance();
