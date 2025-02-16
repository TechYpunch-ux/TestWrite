"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface DetailPanelProps {
  onClose: () => void;
  selectedBlockId: string | null;
  onCreateNewBlock: () => void;
  initialDetails?: string;
  onSave: (details: string) => void;
  onFocusBlock: () => void;
}

export default function DetailPanel({ 
  onClose, 
  selectedBlockId, 
  onCreateNewBlock, 
  initialDetails = "",
  onSave,
  onFocusBlock
}: DetailPanelProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [details, setDetails] = useState(initialDetails);

  // Update details when initialDetails changes
  useEffect(() => {
    setDetails(initialDetails);
  }, [initialDetails]);

  // Focus textarea when selectedBlockId changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      const length = inputRef.current.value.length;
      inputRef.current.setSelectionRange(length, length);
    }
  }, [selectedBlockId, initialDetails]);

  // Auto-save when details change (debounced - for general edits)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (details !== initialDetails) {
        onSave(details);
      }
    }, 500);
    return () => clearTimeout(timeoutId);
  }, [details, initialDetails, onSave]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle Shift + Left Arrow to return to block (no change needed)
    if (e.shiftKey && e.key === "ArrowLeft") {
      e.preventDefault();
      onSave(details); // Keep auto-save on Shift+LeftArrow
      setTimeout(() => {
        onFocusBlock();
      }, 0);
    } 
    // Handle Shift + Right Arrow for new block (OPTIMIZED)
    else if (e.shiftKey && e.key === "ArrowRight") {
      e.preventDefault();
      onSave(details); // IMMEDIATELY save details
      onClose();
      setTimeout(() => {
        onCreateNewBlock();
        onFocusBlock();
      }, 0);
    } 
    // Handle Escape to close panel (no change needed)
    else if (e.key === "Escape") {
      e.preventDefault();
      onSave(details); // Keep auto-save on Escape
      onClose();
    }
  };

  return (
    <div className="w-[400px] bg-white border-l border-gray-100">
      <div className="p-6 flex justify-between items-center">
        <h2 className="text-lg font-medium text-gray-800">Block Details</h2>
        <button
          onClick={() => {
            onSave(details);
            onClose();
          }}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>
      <div className="px-6 pb-6">
        <textarea
          ref={inputRef}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full h-32 p-3 text-gray-700 bg-gray-50 rounded-lg resize-none focus:outline-none focus:ring-1 focus:ring-gray-200 focus:bg-white transition-all"
          placeholder="Add additional details here..."
        />
      </div>
    </div>
  );
} 