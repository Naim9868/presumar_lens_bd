import React from 'react';
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label: React.FC<LabelProps> = ({ 
  children, 
  className, 
  required, 
  ...props 
}) => {
  return (
    <label 
      className={cn(
        'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1',
        className
      )} 
      {...props}
    >
      {children}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );
};