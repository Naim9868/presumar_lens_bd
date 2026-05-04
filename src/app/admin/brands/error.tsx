'use client';

import Button from '@/components/admin/ui/Button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function BrandsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="rounded-full bg-red-100 dark:bg-red-900/20 p-3 mb-4">
          <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Failed to load brands
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <Button onClick={reset}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
      </div>
  );
}