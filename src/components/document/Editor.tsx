"use client";

import { useState, forwardRef, useImperativeHandle, useEffect } from "react";
import Block from "./Block";

interface BlockData {
  id: string;
  content: string;
  type: "text" | "subblock" | "variation";
  details?: string;
  stripColor?: string;
  parentId?: string;
}

interface EditorProps {
  selectedBlockId: string | null;
  setSelectedBlockId: (id: string | null) => void;
  onOpenDetailPanel: () => void;
  onBlocksChange?: (blocks: BlockData[]) => void;
  isDetailPanelOpen?: boolean;
}

const Editor = forwardRef<{ 
  createNewBlock: () => void; 
  updateBlockDetails: (blockId: string, details: string) => void;
  getBlockDetails: (blockId: string) => string;
  getBlocks: () => BlockData[];
  setBlocks: (blocks: BlockData[]) => void;
}, EditorProps>(
  ({ selectedBlockId, setSelectedBlockId, onOpenDetailPanel, onBlocksChange, isDetailPanelOpen }, ref) => {
    const [blocks, setBlocks] = useState<BlockData[]>([
      { id: "1", content: "", type: "text" },
    ]);
    const [lastCreatedBlockId, setLastCreatedBlockId] = useState<string | null>(null);

    const handleContentChange = (blockId: string, content: string) => {
      setBlocks(blocks.map(block => 
        block.id === blockId ? { ...block, content } : block
      ));
    };

    useEffect(() => {
      onBlocksChange?.(blocks);
    }, [blocks, onBlocksChange]);

    const getBlocks = () => blocks;
    const setBlocksData = (newBlocks: BlockData[]) => setBlocks(newBlocks);

    const createNewBlock = () => {
      const newBlock: BlockData = {
        id: Date.now().toString(),
        content: "",
        type: "text",
        details: ""
      };
      
      const currentIndex = blocks.findIndex((b) => b.id === selectedBlockId);
      const newBlocks = [
        ...blocks.slice(0, currentIndex + 1),
        newBlock,
        ...blocks.slice(currentIndex + 1),
      ];

      setBlocks(newBlocks);
      setSelectedBlockId(newBlock.id);
      setLastCreatedBlockId(newBlock.id);
      
      if (isDetailPanelOpen) {
        onOpenDetailPanel();
      }
    };

    const updateBlockDetails = (blockId: string, details: string) => {
      setBlocks(blocks.map(block => 
        block.id === blockId ? { ...block, details } : block
      ));
    };

    const getBlockDetails = (blockId: string) => {
      const block = blocks.find(b => b.id === blockId);
      return block?.details || "";
    };

    const handleStripColorChange = (blockId: string, color: string) => {
      setBlocks(blocks.map(block => 
        block.id === blockId ? { ...block, stripColor: color } : block
      ));
    };

    const deleteBlock = (blockId: string) => {
      if (blocks.length === 1) {
        setBlocks([{ id: "1", content: "", type: "text" }]);
        return;
      }

      const currentIndex = blocks.findIndex((b) => b.id === blockId);
      const newBlocks = blocks.filter((b) => b.id !== blockId);
      
      const newSelectedIndex = Math.max(0, currentIndex - 1);
      setSelectedBlockId(newBlocks[newSelectedIndex].id);
      setBlocks(newBlocks);
    };

    const handleSubblockTransform = (blockId: string, subblockValue: string) => {
      setBlocks(prevBlocks => {
        const index = prevBlocks.findIndex(b => b.id === blockId);
        if (index === -1) return prevBlocks;
        const targetBlock = prevBlocks[index];
        if (targetBlock.type === "text") {
          const variationBlockId = Date.now().toString();
          const extracted = subblockValue.trim() !== "" ? subblockValue : "Variation";
          const variationBlock: BlockData = {
             id: variationBlockId,
             content: extracted,
             type: "variation",
             details: ""
          };
          const modifiedSubblock: BlockData = {
             ...targetBlock,
             type: "subblock",
             parentId: variationBlockId
          };
          return [
             ...prevBlocks.slice(0, index),
             variationBlock,
             modifiedSubblock,
             ...prevBlocks.slice(index + 1)
          ];
        } else if (targetBlock.type === "subblock") {
          const parentId = targetBlock.parentId;
          if (!parentId) return prevBlocks;
          const siblingSubblocks = prevBlocks.filter(b => b.type === "subblock" && b.parentId === parentId);
          const ranking = siblingSubblocks.length + 1;
          const parentBlock = prevBlocks.find(b => b.id === parentId);
          const parentContent = parentBlock ? parentBlock.content : "Variation";
          const newSubblockValue = subblockValue.trim() !== "" ? subblockValue : `${parentContent} ${ranking}`;
          const newSubblock: BlockData = {
             id: Date.now().toString(),
             content: newSubblockValue,
             type: "subblock",
             parentId
          };
          return [
             ...prevBlocks.slice(0, index + 1),
             newSubblock,
             ...prevBlocks.slice(index + 1)
          ];
        }
        return prevBlocks;
      });
    };

    const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        createNewBlock();
      }

      if (e.shiftKey && e.key === "ArrowRight" && selectedBlockId) {
        e.preventDefault();
        onOpenDetailPanel();
      }
    };

    useImperativeHandle(ref, () => ({
      createNewBlock,
      updateBlockDetails,
      getBlockDetails,
      getBlocks,
      setBlocks: setBlocksData,
      getBlocksData: () => blocks
    }));

    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-16 py-6">
          {blocks.map((block) => (
            <Block
              key={block.id}
              block={block}
              isSelected={block.id === selectedBlockId}
              isDetailPanelOpen={isDetailPanelOpen && block.id === selectedBlockId}
              onSelect={() => setSelectedBlockId(block.id)}
              onKeyDown={(e) => handleKeyDown(e, block.id)}
              onOpenDetails={onOpenDetailPanel}
              autoFocus={block.id === lastCreatedBlockId}
              onContentChange={(content) => handleContentChange(block.id, content)}
              onStripColorChange={(color) => handleStripColorChange(block.id, color)}
              onDelete={() => deleteBlock(block.id)}
              onSubblock={(blockId, subblockValue) => handleSubblockTransform(blockId, subblockValue)}
            />
          ))}
        </div>
      </div>
    );
  }
);

Editor.displayName = "Editor";

export default Editor; 