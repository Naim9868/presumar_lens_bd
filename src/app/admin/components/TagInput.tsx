// app/admin/components/TagInput.tsx
'use client';

import { useState, KeyboardEvent } from 'react';
import { X } from 'lucide-react';

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  readOnly?: boolean;
}

export function TagInput({ tags, onChange, placeholder = "Add tags...", readOnly = false }: TagInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 20) {
      onChange([...tags, tag]);
      setInputValue('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  if (readOnly) {
    return (
      <div className="flex flex-wrap gap-1">
        {tags.map(tag => (
          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
            {tag}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1 p-2 border rounded-md min-h-[42px] focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500">
        {tags.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-sm rounded-full">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-blue-600"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addTag}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 outline-none text-sm min-w-[100px]"
        />
      </div>
      <p className="text-xs text-gray-500">Press Enter or comma to add tags. Helps with search and filtering.</p>
    </div>
  );
}