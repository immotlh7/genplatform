'use client';

import { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  url?: string;
  isBuilding?: boolean;
}

export function PreviewPanel({ url = 'https://app.gen3.ai/dashboard', isBuilding = false }: PreviewPanelProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0);

  const deviceWidths = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px'
  };

  const deviceClasses = {
    desktop: 'w-full',
    tablet: 'w-[768px] mx-auto',
    mobile: 'w-[375px] mx-auto'
  };

  useEffect(() => {
    if (!isBuilding) {
      const timer = setTimeout(() => {
        refreshPreview();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isBuilding]);

  const refreshPreview = () => {
    setIsLoading(true);
    setKey(prev => prev + 1);
  };

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="h-full flex flex-col bg-gray-100 dark:bg-gray-900">
      {/* Controls */}
      <div className="p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {/* Device Toggles */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
            <button
              onClick={() => setDevice('desktop')}
              className={`p-1.5 rounded transition-colors ${
                device === 'desktop' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Desktop"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDevice('tablet')}
              className={`p-1.5 rounded transition-colors ${
                device === 'tablet' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Tablet"
            >
              <Tablet className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setDevice('mobile')}
              className={`p-1.5 rounded transition-colors ${
                device === 'mobile' 
                  ? 'bg-white dark:bg-gray-600 shadow-sm' 
                  : 'hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
              title="Mobile"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={refreshPreview}
              disabled={isBuilding}
              title="Refresh"
            >
              <RefreshCw className={`h-3 w-3 ${isBuilding ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={openInNewTab}
              title="Open in new tab"
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Preview Area */}
      <div className="flex-1 relative overflow-auto p-4">
        {/* Building Overlay */}
        {isBuilding && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
                <span className="text-lg font-medium">🔄 Rebuilding...</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Loading State */}
        {isLoading && !isBuilding && (
          <div className="absolute inset-0 bg-white dark:bg-gray-800 z-20 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        )}
        
        {/* Device Frame */}
        <div className="h-full">
          <div className={`${deviceClasses[device]} h-full transition-all duration-300 ease-in-out`}>
            <div className="bg-white dark:bg-gray-950 rounded-lg shadow-2xl h-full overflow-hidden">
              <iframe
                key={key}
                src={url}
                className="w-full h-full"
                onLoad={() => setIsLoading(false)}
                title="Preview"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}