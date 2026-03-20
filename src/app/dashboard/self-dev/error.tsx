'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export default function SelfDevError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Self-Dev page error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center p-6">
        <AlertCircle className="mx-auto h-12 w-12 text-red-600 dark:text-red-400 mb-4" />
        <h2 className="text-xl font-bold mb-2">Error in Self-Development System</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {error.message || 'An unexpected error occurred'}
        </p>
        <div className="space-x-4">
          <button
            onClick={reset}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Try again
          </button>
          <a
            href="/dashboard"
            className="inline-block px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Back to Dashboard
          </a>
        </div>
      </div>
    </div>
  );
}