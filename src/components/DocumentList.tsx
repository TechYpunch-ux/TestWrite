"use client";

import { Plus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, Timestamp, serverTimestamp } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  title: string;
  updatedAt: Timestamp;
  userId: string;
  blocks?: any[];
}

export default function DocumentList() {
  const router = useRouter();
  const { user } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  
  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'documents'),
      where('userId', '==', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        } as Document))
        // Filter out documents that are empty (no title and no blocks)
        .filter(doc => {
          const hasCustomTitle = doc.title && doc.title !== "Untitled Document";
          const hasBlocks = doc.blocks && doc.blocks.some((block: any) => 
            block.content || block.details
          );
          return hasCustomTitle || hasBlocks;
        });
      setDocuments(docs);
    });

    return () => unsubscribe();
  }, [user]);

  const handleCreateDocument = async () => {
    if (!user) return;

    try {
      const docRef = await addDoc(collection(db, 'documents'), {
        title: 'Untitled Document',
        userId: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        blocks: [{ id: "1", content: "", type: "text" }]
      });
      
      router.push(`/document/${docRef.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
    }
  };

  const formatTimestamp = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    return formatDistanceToNow(timestamp.toDate(), { addSuffix: true });
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pt-6">
      <div className="flex justify-between items-center pb-4 border-b mb-4">
        <h1 className="text-xl font-medium">Documents</h1>
        <button 
          onClick={handleCreateDocument}
          className="p-1 hover:bg-gray-100 rounded-full"
        >
          <Plus size={20} />
        </button>
      </div>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            onClick={() => router.push(`/document/${doc.id}`)}
            className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <div className="w-5 h-5 bg-gray-200 rounded"></div>
            <div>
              <p className="text-sm font-medium">{doc.title}</p>
              <p className="text-xs text-gray-500">{formatTimestamp(doc.updatedAt)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 