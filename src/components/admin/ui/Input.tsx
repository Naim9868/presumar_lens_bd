'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes } from 'react';

interface BaseProps {
  label?: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  className?: string;
}

type InputProps = BaseProps & Omit<InputHTMLAttributes<HTMLInputElement>, keyof BaseProps> & {
  textarea?: false;
};

type TextareaProps = BaseProps & Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, keyof BaseProps> & {
  textarea: true;
};

type Props = InputProps | TextareaProps;

const Input = forwardRef<HTMLInputElement | HTMLTextAreaElement, Props>(
  ({ label, error, required, helpText, className = '', textarea, ...props }, ref) => {
    const baseClasses = `
      block w-full rounded-lg border 
      bg-white dark:bg-gray-800
      text-gray-900 dark:text-white
      placeholder-gray-500 dark:placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent
      transition-colors duration-200
      ${error
        ? 'border-red-500 dark:border-red-500'
        : 'border-gray-300 dark:border-gray-600'
      }
      ${props.disabled
        ? 'bg-gray-100 dark:bg-gray-900 cursor-not-allowed'
        : ''
      }
    `;

    const inputClasses = `${baseClasses} px-3 py-2 text-sm`;
    const textareaClasses = `${baseClasses} px-3 py-2 text-sm resize-y`;

    return (
      <div className={`w-full ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {textarea ? (
          <textarea
            ref={ref as React.Ref<HTMLTextAreaElement>}
            className={textareaClasses}
            rows={(props as TextareaHTMLAttributes<HTMLTextAreaElement>).rows || 3}
            {...(props as TextareaHTMLAttributes<HTMLTextAreaElement>)}
            value={(props as TextareaHTMLAttributes<HTMLTextAreaElement>).value ?? ''}
          />
        ) : (
          <input
            ref={ref as React.Ref<HTMLInputElement>}
            className={inputClasses}
            {...(props as InputHTMLAttributes<HTMLInputElement>)}
            value={(props as InputHTMLAttributes<HTMLInputElement>).value ?? ''}
          />
        )}

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

Input.displayName = 'Input';

export default Input;