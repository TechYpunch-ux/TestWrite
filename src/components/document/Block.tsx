"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRight, Palette, Trash2, Type, Bold, Italic, Underline as UnderlineIcon } from "lucide-react";
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import Underline from '@tiptap/extension-underline';
import BubbleMenuExtension from '@tiptap/extension-bubble-menu';

interface BlockProps {
  block: {
    id: string;
    content: string;
    type: string;
    details?: string;
    stripColor?: string;
  };
  isSelected: boolean;
  isDetailPanelOpen?: boolean;
  onSelect: () => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
  onOpenDetails: () => void;
  autoFocus?: boolean;
  onContentChange?: (content: string) => void;
  onStripColorChange?: (color: string) => void;
  onDelete?: () => void;
  onSubblock?: (blockId: string, subblockValue: string) => void;
}

const STRIP_COLORS = [
  { name: 'Default', value: 'bg-gray-200' },
  { name: 'Red', value: 'bg-red-400' },
  { name: 'Green', value: 'bg-green-400' },
  { name: 'Blue', value: 'bg-blue-400' },
  { name: 'Purple', value: 'bg-purple-400' },
  { name: 'Yellow', value: 'bg-yellow-400' },
];

const TEXT_COLORS = [
  { name: 'Default', value: 'inherit' },
  { name: 'Gray', value: '#374151' },
  { name: 'Red', value: '#DC2626' },
  { name: 'Blue', value: '#2563EB' },
  { name: 'Green', value: '#059669' },
  { name: 'Purple', value: '#7C3AED' },
];

export default function Block({ block, isSelected, isDetailPanelOpen, onSelect, onKeyDown, onOpenDetails, autoFocus, onContentChange, onStripColorChange, onDelete, onSubblock }: BlockProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showStripColorPicker, setShowStripColorPicker] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        paragraph: {},
        heading: {
          levels: [1, 2],
          HTMLAttributes: {
            class: 'heading-styles',
          },
        },
      }),
      TextStyle,
      Underline,
      Color,
      BubbleMenuExtension,
    ],
    content: block.content,
    autofocus: autoFocus ? 'end' : false,
    editable: true,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (block.content !== html) {
        onContentChange?.(html);
      }
    },
    onFocus: () => {
      onSelect();
    },
    editorProps: {
      handleKeyDown: (view, event) => {
        // Handle Tab for autocomplete in any state
        if (event.key === 'Tab' && !event.shiftKey) {
          event.preventDefault();
          handleAutocomplete();
          return true;
        }

        // Handle Shift + Tab for subblock transformation
        if (event.shiftKey && event.key === 'Tab') {
          event.preventDefault();
          handleSubblockTransformation();
          return true;
        }

        // Handle Shift + Enter for new block
        if (event.shiftKey && event.key === "Enter") {
          event.preventDefault();
          onKeyDown(event as unknown as React.KeyboardEvent);
          return true;
        }

        // Handle Enter for new block
        if (event.key === "Enter" && !event.shiftKey) {
          event.preventDefault();
          onKeyDown(event as unknown as React.KeyboardEvent);
          return true;
        }

        // Handle Shift + Right Arrow for details panel
        if (event.shiftKey && event.key === "ArrowRight") {
          event.preventDefault();
          // Directly open details panel and select block
          onSelect();
          onOpenDetails();
          return true;
        }

        // Handle Shift + Backspace for delete
        if (event.shiftKey && event.key === "Backspace") {
          event.preventDefault();
          onDelete?.();
          return true;
        }

        return false;
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== block.content) {
      editor.commands.setContent(block.content);
    }
  }, [block.content, editor]);

  const handleStripClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStripColorPicker(!showStripColorPicker);
  };

  const handleColorSelect = (color: string) => {
    onStripColorChange?.(color);
    setShowColorPicker(false);
  };

  const handleAutocomplete = async () => {
    try {
      // Get current editor state
      if (!editor) return;
      
      const currentContent = editor.getText();
      const selection = editor.state.selection;
      const cursorPosition = selection.$head.pos;
      const textBeforeCursor = currentContent.slice(0, cursorPosition);
      const textAfterCursor = currentContent.slice(cursorPosition);

      // Get context from all previous blocks
      const blocks = document.querySelectorAll('[data-block]');
      const previousBlocksContent: string[] = [];
      
      for (let i = 0; i < blocks.length; i++) {
        const blockElement = blocks[i].querySelector('.ProseMirror');
        const blockContent = blockElement?.textContent || '';
        
        if (blocks[i].getAttribute('data-block-id') === block.id) {
          break;
        } else if (blockContent.trim()) {
          previousBlocksContent.push(blockContent);
        }
      }

      // Show loading state without losing existing content
      editor.commands.insertContentAt(cursorPosition, ' Generating...');

      const response = await fetch('/api/gemini/completion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          previousContent: previousBlocksContent.join('\n'),
          currentContent: textBeforeCursor.trim() // Send only text before cursor
        }),
      });

      if (!response.ok) throw new Error('Failed to get completion');

      const data = await response.json();
      const completion = data.completion.trim();
      
      // NEW CODE: Remove duplicate prefix if the generated completion starts with the textBeforeCursor
      let newContent = completion;
      if (textBeforeCursor && completion.startsWith(textBeforeCursor)) {
        newContent = completion.substring(textBeforeCursor.length).trimStart();
      }
      
      // Remove loading indicator and insert the adjusted completion text
      editor.chain()
        .setTextSelection(cursorPosition)
        .deleteRange({ from: cursorPosition, to: cursorPosition + ' Generating...'.length })
        .insertContentAt(cursorPosition, newContent + ' ')
        .run();

      onContentChange?.(editor.getHTML());

    } catch (error) {
      console.error('Autocomplete error:', error);
      if (editor) {
        // Remove loading indicator and restore original content
        const cursorPosition = editor.state.selection.$head.pos;
        editor.chain()
          .setTextSelection(cursorPosition)
          .deleteRange({ from: cursorPosition - ' Generating...'.length, to: cursorPosition })
          .run();
      }
    }
  };

  const handleSubblockTransformation = () => {
    if (!editor) return;
    const htmlContent = editor.getHTML();
    const boldRegex = /<strong>(.*?)<\/strong>|<b>(.*?)<\/b>/;
    const match = boldRegex.exec(htmlContent);
    const subblockValue = match ? (match[1] || match[2]) : "";
    // Call the onSubblock callback with the extracted value (if provided by the parent)
    if (onSubblock) {
      onSubblock(block.id, subblockValue);
    }
  };

  return (
    <div 
      className={`group relative mb-3 flex items-start rounded-lg p-2 transition-colors duration-200 ${
        isSelected && isDetailPanelOpen ? 'bg-blue-50' : 'hover:bg-gray-50'
      } ${block.type === 'subblock' ? 'ml-8' : ''} ${block.type === 'variation' ? 'text-2xl font-bold' : ''}`}
      data-block
      data-block-id={block.id}
      data-heading-level={editor?.isActive('heading', { level: 1 }) ? 1 : editor?.isActive('heading', { level: 2 }) ? 2 : 0}
    >
      {editor && (
        <BubbleMenu
          editor={editor}
          tippyOptions={{ duration: 100 }}
          className="flex items-center space-x-1 bg-white rounded-lg shadow-lg border border-gray-200 p-2"
        >
          <div className="flex space-x-1 border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-1 rounded hover:bg-gray-100 ${
                editor.isActive('heading', { level: 1 }) ? 'bg-gray-100' : ''
              }`}
              title="Heading 1"
            >
              <div className="flex items-center">
                <Type size={14} className="font-bold" />
                <span className="text-xs ml-0.5">1</span>
              </div>
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-1 rounded hover:bg-gray-100 ${
                editor.isActive('heading', { level: 2 }) ? 'bg-gray-100' : ''
              }`}
              title="Heading 2"
            >
              <div className="flex items-center">
                <Type size={14} />
                <span className="text-xs ml-0.5">2</span>
              </div>
            </button>
            <button
              onClick={() => editor.chain().focus().setParagraph().run()}
              className={`p-1 rounded hover:bg-gray-100 ${
                editor.isActive('paragraph') ? 'bg-gray-100' : ''
              }`}
              title="Paragraph"
            >
              <Type size={14} />
            </button>
          </div>

          <div className="flex space-x-1 border-r border-gray-200 pr-2 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1 rounded hover:bg-gray-100 ${
                editor.isActive('bold') ? 'bg-gray-100' : ''
              }`}
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1 rounded hover:bg-gray-100 ${
                editor.isActive('italic') ? 'bg-gray-100' : ''
              }`}
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1 rounded hover:bg-gray-100 ${
                editor.isActive('underline') ? 'bg-gray-100' : ''
              }`}
            >
              <UnderlineIcon size={14} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 rounded hover:bg-gray-100 flex items-center space-x-1"
            >
              <div 
                className="w-4 h-4 rounded-full border border-gray-300" 
                style={{ 
                  backgroundColor: editor.getAttributes('textStyle').color || 'transparent' 
                }} 
              />
            </button>
            {showColorPicker && (
              <div className="absolute left-0 top-full mt-1 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[120px]">
                <div className="grid grid-cols-2 gap-3">
                  {TEXT_COLORS.map((color) => (
                    <button
                      key={color.name}
                      onClick={() => {
                        editor.chain().focus().setColor(color.value).run();
                        setShowColorPicker(false);
                      }}
                      className="w-8 h-8 rounded-lg hover:ring-2 hover:ring-gray-200 flex items-center justify-center"
                      title={color.name}
                    >
                      <div 
                        className="w-6 h-6 rounded-full border border-gray-200"
                        style={{ backgroundColor: color.value }}
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </BubbleMenu>
      )}
      <div className="absolute left-0 top-0 bottom-0 w-1 -ml-6 flex items-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="absolute -left-8 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-red-50 transition-all duration-200"
        >
          <Trash2 
            size={14} 
            className="text-gray-400 hover:text-red-500 transition-colors"
          />
        </button>
        <div className="relative w-full h-full">
          <div
            onClick={handleStripClick}
            className={`w-full h-full rounded-sm cursor-pointer transition-colors duration-200 ${
              block.stripColor || (isSelected ? "bg-gray-200" : "bg-transparent group-hover:bg-gray-100")
            }`}
          />
          {showStripColorPicker && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 mt-1 p-3 bg-white rounded-lg shadow-lg border border-gray-200 z-20 min-w-[120px]">
              <div className="grid grid-cols-2 gap-3">
                {STRIP_COLORS.map((color) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      onStripColorChange?.(color.value);
                      setShowStripColorPicker(false);
                    }}
                    className="w-8 h-8 rounded-lg hover:ring-2 hover:ring-gray-200 flex items-center justify-center"
                    title={color.name}
                  >
                    <div 
                      className={`w-6 h-6 rounded-sm border border-gray-200 ${color.value}`}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <EditorContent 
          editor={editor} 
          className={`outline-none min-h-[1.5em] py-1 text-gray-800 [&_*]:outline-none break-words whitespace-pre-wrap
            [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:mb-2
            [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mb-1 ${
              isSelected && isDetailPanelOpen ? 'text-blue-900' : ''
            }`}
        />
      </div>
      <button
        onClick={() => {
          onSelect();
          onOpenDetails();
        }}
        tabIndex={-1}
        className={`ml-2 p-1 rounded transition-all duration-200 flex-shrink-0 ${
          block.details ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        } ${isDetailPanelOpen && isSelected ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
      >
        <ChevronRight 
          size={16} 
          className={`transition-colors ${
            block.details 
              ? 'text-gray-900' 
              : isDetailPanelOpen && isSelected 
                ? 'text-blue-600' 
                : 'text-gray-400'
          }`}
        />
      </button>
    </div>
  );
} 