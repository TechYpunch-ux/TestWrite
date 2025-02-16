import { NextResponse } from 'next/server';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// PUT /api/ai-style/{id}
// Updates an AI style document with the specified id.
export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const updateData = await req.json();
    const docRef = doc(db, 'aiStyles', params.id);
    await updateDoc(docRef, updateData);
    
    return NextResponse.json({ 
      message: 'Style updated successfully', 
      id: params.id,
      ...updateData 
    });
  } catch (error) {
    console.error('Style update error:', error);
    return NextResponse.json(
      { error: 'Failed to update AI style' },
      { status: 500 }
    );
  }
}

// DELETE /api/ai-style/{id}
// Deletes an AI style document with the specified id.
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const docRef = doc(db, 'aiStyles', params.id);
    await deleteDoc(docRef);
    
    return NextResponse.json({ 
      message: 'Style deleted successfully', 
      id: params.id 
    });
  } catch (error) {
    console.error('Style deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete AI style' },
      { status: 500 }
    );
  }
} 