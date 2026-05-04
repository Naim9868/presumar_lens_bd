'use client';

import { useEffect, ReactNode } from 'react';
import { X } from 'lucide-react';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showConfirm?: boolean;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  loading?: boolean;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showConfirm = false,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  loading = false
}: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className={`relative w-full ${sizes[size]} transform overflow-hidden rounded-lg bg-white dark:bg-gray-800 shadow-xl transition-all animate-scale-in`}>
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-6">
            {children}
          </div>
          
          {/* Footer */}
          {(showConfirm || onConfirm) && (
            <div className="flex justify-end space-x-3 border-t border-gray-200 dark:border-gray-700 p-4">
              <Button variant="secondary" onClick={onClose}>
                {cancelText}
              </Button>
              <Button variant="primary" onClick={onConfirm} loading={loading}>
                {confirmText}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}