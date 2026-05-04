'use client';

import React from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  checked, 
  onCheckedChange, 
  className,
  disabled,
  ...props 
}) => {
  return (
    <div className="relative inline-flex items-center">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        disabled={disabled}
        className={cn(
          'h-4 w-4 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
          'focus:ring-2 focus:ring-amber-500 focus:ring-offset-2',
          'disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
      {checked && (
        <Check className="pointer-events-none absolute left-0.5 top-0.5 h-3 w-3 text-amber-600 dark:text-amber-400" />
      )}
    </div>
  );
};