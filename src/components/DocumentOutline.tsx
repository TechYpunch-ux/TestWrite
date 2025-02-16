import React from 'react';
import { BlockData } from './document/Editor';

interface DocumentOutlineProps {
  blocks: BlockData[];
  onNavigate: (blockId: string) => void;
}

const DocumentOutline: React.FC<DocumentOutlineProps> = ({ blocks = [], onNavigate }) => {
  const headings = blocks.filter(block => 
    block.content.startsWith('<h1') || block.content.startsWith('<h2')
  );

  const getHeadingText = (html: string) => {
    const div = document.createElement('div');
    div.innerHTML = html;
    return div.textContent || '';
  };

  const getHeadingLevel = (html: string) => {
    return html.startsWith('<h1') ? 1 : 2;
  };

  return (
    <div className="w-64 border-r border-gray-100 p-4 overflow-y-auto">
      <h3 className="text-sm font-semibold text-gray-600 mb-4">Document Outline</h3>
      <ul className="space-y-2">
        {headings.map(block => (
          <li
            key={block.id}
            className="cursor-pointer text-sm text-gray-600 hover:text-blue-600 hover:bg-blue-50 p-2 rounded"
            onClick={() => onNavigate(block.id)}
            style={{ marginLeft: getHeadingLevel(block.content) === 2 ? '1rem' : '0' }}
          >
            {getHeadingText(block.content)}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DocumentOutline; 