'use client';

import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastProps {
  id: string;
  message: string;
  type: ToastType;
  onClose: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: XCircle,
  info: Info,
  warning: AlertTriangle
};

const colors = {
  success: 'bg-green-50 text-green-800 border-green-200',
  error: 'bg-red-50 text-red-800 border-red-200',
  info: 'bg-blue-50 text-blue-800 border-blue-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200'
};

export default function Toast({ id, message, type, onClose }: ToastProps) {
  const Icon = icons[type];
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(id);
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [id, onClose]);
  
  return (
    <div className={`flex items-center justify-between rounded-lg border p-4 shadow-lg ${colors[type]}`}>
      <div className="flex items-center space-x-3">
        <Icon className="h-5 w-5" />
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={() => onClose(id)} className="ml-4">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}