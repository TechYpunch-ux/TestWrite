import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDocs, query, where } from 'firebase/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

// Move helper functions outside the POST function
function getAwarenessRules(awareness: string) {
  const rules: {[key: string]: string} = {
    unaware: "- Gently introduce the problem before mentioning solutions",
    "problem aware": "- Focus on differentiating the problem from common misunderstandings",
    "solution aware": "- Contrast with inferior solutions they might have tried", 
    "product aware": "- Emphasize unique mechanisms and proof elements",
    "most aware": "- Create urgency with time-sensitive offers and risk reversal"
  };
  return rules[awareness] || "";
}

function getSophisticationRules(sophistication: string) {
  const rules: {[key: string]: string} = {
    "No competition": "- Make bold benefit-focused claims",
    "Some competition": "- Use specific numbers and timeframes",
    "More competition W/ specific claims": "- Lead with unique mechanism early",
    "Heavy competition W/ mechanism": "- Introduce new problem mechanism first",
    "Heavy competition W/ advanced mechanism": "- Use story-driven indirect approach"
  };
  return rules[sophistication] || "";
}

export async function POST(request: Request) {
  const { previousContent, currentContent, styleId } = await request.json();
  
  try {
    // Initialize styleData with default values
    let styleData = {
      marketAwareness: 'unaware',
      marketSophistication: 'No competition',
      productName: '',
      bigProblem: '',
      bigPromise: '',
      problemMechanism: '',
      solutionMechanism: '',
      proofElements: '',
      purpose: '',
      trainingData: ''
    };

    if (styleId) {
      const styleDoc = await getDocs(query(
        collection(db, 'aiStyles'),
        where('id', '==', styleId)
      ));
      
      if (!styleDoc.empty) {
        styleData = { ...styleData, ...styleDoc.docs[0].data() };
      }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `${styleData.purpose}\nExamples:\n${styleData.trainingData.slice(0, 1000)}

    You are a world-class direct response copywriter. Continue the following text while STRICTLY ADHERING to these parameters:

    Market Awareness: ${styleData.marketAwareness}
    Market Sophistication: ${styleData.marketSophistication}
    Product: ${styleData.productName}
    Big Problem: ${styleData.bigProblem}
    Big Promise: ${styleData.bigPromise}
    Problem Mechanism: ${styleData.problemMechanism}
    Solution Mechanism: ${styleData.solutionMechanism}
    Proof Elements: ${styleData.proofElements}

    RULES:
    ${getAwarenessRules(styleData.marketAwareness)}
    ${getSophisticationRules(styleData.marketSophistication)}
    - Use conversational, story-driven language
    - Include subtle psychological triggers
    - Address hidden objections naturally
    - Mirror the prospect's internal dialogue

    Document context:
    ${previousContent || "No previous content"}

    Current incomplete sentence:
    ${currentContent || ""}

    Completion (continue directly in the same voice/style):`;

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