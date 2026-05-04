'use client';

import { useUIStore } from '@/stores/uiStore';

export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);
  
  return {
    showToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => {
      addToast(message, type);
    }
  };
};