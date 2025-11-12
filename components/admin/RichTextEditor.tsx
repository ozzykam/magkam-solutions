'use client';

import React, { useMemo } from 'react';
import dynamic from 'next/dynamic';
import 'react-quill-new/dist/quill.snow.css';

// Dynamically import ReactQuill to avoid SSR issues (using React 19 compatible version)
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const modules = useMemo(
    () => ({
      toolbar: [
        // Header levels
        [{ header: [1, 2, 3, 4, 5, 6, false] }],

        // Font and size
        [{ font: [] }],
        [{ size: ['small', false, 'large', 'huge'] }],

        // Text formatting
        ['bold', 'italic', 'underline', 'strike'],

        // Superscript/Subscript
        [{ script: 'sub' }, { script: 'super' }],

        // Colors
        [{ color: [] }, { background: [] }],

        // Lists and indent
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ indent: '-1' }, { indent: '+1' }],

        // Text alignment and direction
        [{ align: [] }],
        [{ direction: 'rtl' }],

        // Blocks
        ['blockquote', 'code-block'],

        // Inline code
        ['code'],

        // Media
        ['link', 'image', 'video'],

        // Clear formatting
        ['clean'],
      ],
    }),
    []
  );

  const formats = [
    'header',
    'font',
    'size',
    'bold',
    'italic',
    'underline',
    'strike',
    'script',
    'color',
    'background',
    'list',
    'indent',
    'align',
    'direction',
    'blockquote',
    'code-block',
    'code',
    'link',
    'image',
    'video',
  ];

  return (
    <div className="rich-text-editor">
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        modules={modules}
        formats={formats}
        placeholder={placeholder}
        className="bg-white"
      />
      <style jsx global>{`
        .rich-text-editor .ql-container {
          font-size: 16px;
          min-height: 300px;
        }

        .rich-text-editor .ql-editor {
          min-height: 300px;
          max-height: 600px;
          overflow-y: auto;
        }

        .rich-text-editor .ql-toolbar {
          background-color: #f9fafb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          border-color: #d1d5db;
        }

        .rich-text-editor .ql-container {
          border-bottom-left-radius: 0.5rem;
          border-bottom-right-radius: 0.5rem;
          border-color: #d1d5db;
        }

        .rich-text-editor .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }

        /* Focus state */
        .rich-text-editor .ql-container.ql-snow {
          border-color: #d1d5db;
        }

        .rich-text-editor .ql-toolbar.ql-snow + .ql-container.ql-snow {
          border-top: 0;
        }

        /* Ensure proper spacing in toolbar groups */
        .rich-text-editor .ql-toolbar.ql-snow .ql-formats {
          margin-right: 15px;
        }
      `}</style>
    </div>
  );
}
