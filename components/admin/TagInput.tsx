'use client';

import React, { useState, KeyboardEvent } from 'react';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  maxTags?: number;
  maxLength?: number;
  label?: string;
  helperText?: string;
}

export default function TagInput({
  tags,
  onChange,
  placeholder = 'Add a tag...',
  maxTags = 15,
  maxLength = 30,
  label,
  helperText,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAddTag = () => {
    const trimmed = inputValue.trim();

    // Validation
    if (!trimmed) {
      return;
    }

    if (tags.includes(trimmed)) {
      setError('Tag already exists');
      return;
    }

    if (tags.length >= maxTags) {
      setError(`Maximum ${maxTags} tags allowed`);
      return;
    }

    if (trimmed.length > maxLength) {
      setError(`Tag must be ${maxLength} characters or less`);
      return;
    }

    // Add tag
    onChange([...tags, trimmed]);
    setInputValue('');
    setError(null);
  };

  const handleRemoveTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    setError(null);
  };

  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}

      {/* Tag Display */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {tags.map((tag, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="hover:text-primary-900 transition-colors"
                aria-label={`Remove ${tag}`}
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Input Field */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={tags.length >= maxTags}
          className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
            error ? 'border-red-500' : 'border-gray-300'
          } disabled:bg-gray-100 disabled:cursor-not-allowed`}
          maxLength={maxLength}
        />
        <button
          type="button"
          onClick={handleAddTag}
          disabled={!inputValue.trim() || tags.length >= maxTags}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}

      {/* Helper Text / Counter */}
      {helperText && !error && (
        <p className="mt-2 text-sm text-gray-500">{helperText}</p>
      )}

      <p className="mt-2 text-sm text-gray-500">
        {tags.length} / {maxTags} tags
      </p>
    </div>
  );
}
