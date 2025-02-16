"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import DetailPanel from "@/components/document/DetailPanel";
import Editor from "@/components/document/Editor";
import DocumentOutline from '@/components/DocumentOutline';

export default function DocumentPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const [title, setTitle] = useState("Untitled Document");
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const editorRef = useRef<{ 
    createNewBlock: () => void;
    updateBlockDetails: (blockId: string, details: string) => void;
    getBlockDetails: (blockId: string) => string;
    getBlocks: () => any[];
    setBlocks: (blocks: any[]) => void;
  } | null>(null);
  const [documentBlocks, setDocumentBlocks] = useState<BlockData[]>([]);
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);

  useEffect(() => {
    if (!user || !params.id) return;

    const fetchDocument = async () => {
      const docRef = doc(db, 'documents', params.id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setTitle(data.title || "Untitled Document");
        if (data.blocks && editorRef.current) {
          editorRef.current.setBlocks(data.blocks);
        } else if (editorRef.current) {
          editorRef.current.setBlocks([{ id: "1", content: "", type: "text" }]);
        }
      }
    };

    fetchDocument();
  }, [params.id, user]);

  const saveDocument = async () => {
    if (!user || !params.id || !editorRef.current) return;

    try {
      const blocks = editorRef.current.getBlocks();
      if (title !== "Untitled Document" || blocks.some(block => block.content || block.details)) {
        const docRef = doc(db, 'documents', params.id as string);
        await updateDoc(docRef, {
          title,
          blocks,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      saveDocument();
    }, 1000);

    return () => clearTimeout(timeoutId);
  }, [title]);

  const handleCreateNewBlock = () => {
    if (editorRef.current) {
      editorRef.current.createNewBlock();
    }
  };

  const handleSaveDetails = (details: string) => {
    if (editorRef.current && selectedBlockId) {
      editorRef.current.updateBlockDetails(selectedBlockId, details);
    }
  };

  const getInitialDetails = () => {
    if (!selectedBlockId || !editorRef.current) return "";
    return editorRef.current.getBlockDetails(selectedBlockId);
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editorRef.current) {
        editorRef.current.createNewBlock();
        setIsDetailPanelOpen(false);
      }
    }

    if (e.shiftKey && e.key === "ArrowRight" && selectedBlockId) {
      e.preventDefault();
      setIsDetailPanelOpen(true);
    }
  };

  const handleFocusBlock = () => {
    const blockElement = document.querySelector(`[data-block-id="${selectedBlockId}"]`) as HTMLElement;
    blockElement?.focus();
  };

  const handleNavigateBack = async () => {
    await saveDocument();
    router.push("/");
  };

  useEffect(() => {
    return () => {
      saveDocument();
    };
  }, []);

  const handleOpenDetailPanel = () => {
    if (isDetailPanelOpen) {
      setIsDetailPanelOpen(false);
      setTimeout(() => {
        setIsDetailPanelOpen(true);
      }, 0);
    } else {
      setIsDetailPanelOpen(true);
    }
  };

  return (
    <div className="h-screen flex bg-white">
      <DocumentOutline 
        blocks={documentBlocks}
        onNavigate={(blockId) => {
          const element = document.querySelector(`[data-block-id="${blockId}"]`);
          element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          setSelectedBlockId(blockId);
        }}
      />
      <div className={`flex-1 flex flex-col ${isAIPanelOpen ? 'pointer-events-none opacity-50' : ''}`}>
        <div className="px-6 py-4">
          <div className="max-w-3xl mx-auto flex items-center space-x-4">
            <button
              onClick={handleNavigateBack}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xl font-medium text-gray-800 focus:outline-none flex-1"
            />
          </div>
        </div>
        <Editor
          ref={editorRef}
          selectedBlockId={selectedBlockId}
          setSelectedBlockId={setSelectedBlockId}
          onOpenDetailPanel={handleOpenDetailPanel}
          onBlocksChange={(blocks) => setDocumentBlocks(blocks)}
          isDetailPanelOpen={isDetailPanelOpen}
        />
      </div>
      {isDetailPanelOpen && (
        <DetailPanel
          onClose={() => setIsDetailPanelOpen(false)}
          selectedBlockId={selectedBlockId}
          onCreateNewBlock={handleCreateNewBlock}
          initialDetails={getInitialDetails()}
          onSave={handleSaveDetails}
          onFocusBlock={handleFocusBlock}
        />
      )}
    </div>
  );
} 