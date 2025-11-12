'use client';

import React from 'react';
import {
  BoldIcon,
  ItalicIcon,
  ListBulletIcon,
  NumberedListIcon,
  LinkIcon,
  CodeBracketIcon,
} from '@heroicons/react/24/outline';

interface MarkdownToolbarProps {
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (newValue: string, cursorPosition: number) => void;
}

export default function MarkdownToolbar({ textareaRef, onInsert }: MarkdownToolbarProps) {
  const insertMarkdown = (
    before: string,
    after: string = '',
    placeholder: string = ''
  ) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const selectedText = text.substring(start, end);

    let newText: string;
    let cursorPos: number;

    if (selectedText) {
      // Wrap selected text
      newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
      cursorPos = start + before.length + selectedText.length + after.length;
    } else {
      // Insert placeholder
      newText = text.substring(0, start) + before + placeholder + after + text.substring(end);
      cursorPos = start + before.length + placeholder.length;
    }

    onInsert(newText, cursorPos);
  };

  const insertLineStart = (prefix: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const text = textarea.value;

    // Find the start of the current line
    const lineStart = text.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = text.indexOf('\n', start);
    const currentLine = text.substring(lineStart, lineEnd === -1 ? text.length : lineEnd);

    // Check if line already has the prefix
    if (currentLine.trim().startsWith(prefix.trim())) {
      // Remove prefix
      const newLine = currentLine.replace(new RegExp(`^\\s*${prefix.trim()}\\s*`), '');
      const newText = text.substring(0, lineStart) + newLine + text.substring(lineEnd === -1 ? text.length : lineEnd);
      onInsert(newText, lineStart + newLine.length);
    } else {
      // Add prefix
      const newText = text.substring(0, lineStart) + prefix + currentLine.trimStart() + text.substring(lineEnd === -1 ? text.length : lineEnd);
      onInsert(newText, start + prefix.length);
    }
  };

  const handleBold = () => insertMarkdown('**', '**', 'bold text');
  const handleItalic = () => insertMarkdown('*', '*', 'italic text');
  const handleHeading1 = () => insertLineStart('# ');
  const handleHeading2 = () => insertLineStart('## ');
  const handleHeading3 = () => insertLineStart('### ');
  const handleBulletList = () => insertLineStart('- ');
  const handleNumberedList = () => insertLineStart('1. ');
  const handleLink = () => insertMarkdown('[', '](url)', 'link text');
  const handleQuote = () => insertLineStart('> ');
  const handleCode = () => insertMarkdown('`', '`', 'code');
  const handleHorizontalRule = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const text = textarea.value;
    const newText = text.substring(0, start) + '\n---\n' + text.substring(start);
    onInsert(newText, start + 5);
  };

  return (
    <div className="border border-gray-300 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
      {/* Headings */}
      <button
        type="button"
        onClick={handleHeading1}
        className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Heading 1 (Large)"
      >
        H1
      </button>
      <button
        type="button"
        onClick={handleHeading2}
        className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Heading 2 (Medium)"
      >
        H2
      </button>
      <button
        type="button"
        onClick={handleHeading3}
        className="px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Heading 3 (Small)"
      >
        H3
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      {/* Text formatting */}
      <button
        type="button"
        onClick={handleBold}
        className="p-1.5 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Bold"
      >
        <BoldIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={handleItalic}
        className="p-1.5 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Italic"
      >
        <ItalicIcon className="w-5 h-5" />
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      {/* Lists */}
      <button
        type="button"
        onClick={handleBulletList}
        className="p-1.5 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Bullet List"
      >
        <ListBulletIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={handleNumberedList}
        className="p-1.5 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Numbered List"
      >
        <NumberedListIcon className="w-5 h-5" />
      </button>

      <div className="w-px h-8 bg-gray-300 mx-1" />

      {/* Other */}
      <button
        type="button"
        onClick={handleLink}
        className="p-1.5 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Link"
      >
        <LinkIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={handleCode}
        className="p-1.5 text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Inline Code"
      >
        <CodeBracketIcon className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={handleQuote}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Quote"
      >
        &quot;
      </button>
      <button
        type="button"
        onClick={handleHorizontalRule}
        className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded border border-gray-300 bg-white"
        title="Horizontal Rule"
      >
        ―
      </button>

      <div className="flex-1" />

      {/* Help text */}
      <div className="text-xs text-gray-500 flex items-center px-2">
        <span className="hidden sm:inline">Select text, then click a button to format it</span>
      </div>
    </div>
  );
}
