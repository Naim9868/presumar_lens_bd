'use client';

import { forwardRef, SelectHTMLAttributes } from 'react';

interface Option {
  value: string;
  label: string;
}

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className'> {
  label?: string;
  error?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
  helpText?: string;
  className?: string;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, required, options, placeholder, helpText, className = '', ...props }, ref) => {
    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <select
          ref={ref}
          className={`
            block w-full rounded-lg border px-3 py-2 text-sm
            bg-white dark:bg-gray-800
            text-gray-900 dark:text-white
            border-gray-300 dark:border-gray-600
            focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
            transition-colors duration-200
            ${error ? 'border-red-500 dark:border-red-500' : ''}
            ${props.disabled ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed' : ''}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled={props.required}>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        
        {helpText && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{helpText}</p>
        )}
        
        {error && (
          <p className="mt-1 text-xs text-red-500 dark:text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;