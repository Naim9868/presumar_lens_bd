'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';

interface FilterSectionProps {
  title: string;
  section: string;
  expandedSections: string[];
  toggleSection: (section: string) => void;
  children: React.ReactNode;
}

export function FilterSection({
  title,
  section,
  expandedSections,
  toggleSection,
  children,
}: FilterSectionProps) {
  return (
    <div className="border-b border-gray-200 dark:border-gray-800 py-4">
      <button
        onClick={() => toggleSection(section)}
        className="w-full flex justify-between items-center text-left"
      >
        <span className="font-semibold text-gray-900 dark:text-white">
          {title}
        </span>

        {expandedSections.includes(section) ? (
          <ChevronUp size={18} />
        ) : (
          <ChevronDown size={18} />
        )}
      </button>

      {expandedSections.includes(section) && (
        <div className="mt-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}