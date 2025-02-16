import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { addDocument } from '@/lib/firebase/firebaseUtils';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const styleData = await req.json();
    
    const docRef = await addDocument('aiStyles', styleData);
    
    return NextResponse.json({ 
      id: docRef.id,
      ...styleData
    });
    
  } catch (error) {
    console.error('Style creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create AI style' },
      { status: 500 }
    );
  }
} 