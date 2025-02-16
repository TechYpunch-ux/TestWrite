import React from 'react';

interface BlockData {
  id: string;
  content: string;
  type: string;
  level: number; // Added based on usage in marginLeft
  details?: string;
  stripColor?: string;
  children?: BlockData[]; // For nested blocks
}

interface BlockProps {
  block: BlockData;
  onIndent: (blockId: string) => void;
  onOutdent: (blockId: string) => void;
}

const Block: React.FC<BlockProps> = ({ block, onIndent, onOutdent }) => {
  return (
    <div style={{ marginLeft: block.level * 20 }}> {/* Indentation based on level */}
      <span>{block.content}</span>
      <button onClick={() => onIndent(block.id)}>Indent</button>
      <button onClick={() => onOutdent(block.id)}>Outdent</button>
      {/* Render children recursively */}
      {block.children && block.children.map((child: BlockData) => (
        <Block key={child.id} block={child} onIndent={onIndent} onOutdent={onOutdent} />
      ))}
    </div>
  );
};

export default Block; 