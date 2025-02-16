import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const { previousContent } = await request.json();
    
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    
    const prompt = `You are a helpful writing assistant. Given the following text, write ONE natural-sounding sentence that would logically follow. The sentence should flow naturally and maintain the same style, tone, and context.

Previous content:
${previousContent || "No previous content"}

Requirements:
- Write exactly one sentence
- Match the writing style, tone, and terminology of the previous text
- Keep it concise and natural
- If there's no previous content, write an engaging opening sentence about the topic
- Do not use phrases like "In conclusion" or "Furthermore" unless they match the context
- Ensure the sentence flows naturally from the previous content

Response (one sentence only):`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }]}],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.8,
        maxOutputTokens: 100,
      },
    });

    const response = await result.response;
    const text = response.text().trim();

    // Ensure we only return a single sentence
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    const singleSentence = sentences[0] + '.';

    return new Response(JSON.stringify({ completion: singleSentence }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Gemini API error:', error);
    return new Response(JSON.stringify({ error: 'Failed to generate completion' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
} 