'use client';

import { useState, useEffect } from 'react';
import { Monitor, Tablet, Smartphone, ExternalLink, RefreshCw, Loader2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface PreviewPanelProps {
  url?: string;
  isBuilding?: boolean;
}

export function PreviewPanel({ url = 'https://app.gen3.ai', isBuilding = false }: PreviewPanelProps) {
  const [device, setDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isLoading, setIsLoading] = useState(true);
  const [key, setKey] = useState(0); // Used to force iframe refresh

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
      // Auto-refresh 5 seconds after build completes
      const timer = setTimeout(() => {
        refreshPreview();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isBuilding]);

  const refreshPreview = () => {
    setIsLoading(true);
    setKey(prev => prev + 1); // Force iframe to reload
  };

  const openInNewTab = () => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Live Preview</CardTitle>
          <div className="flex items-center gap-2">
            {/* Device Toggles */}
            <div className="flex bg-gray-100 dark:bg-gray-800 rounded-md p-1">
              <button
                onClick={() => setDevice('desktop')}
                className={`p-2 rounded transition-colors ${
                  device === 'desktop' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Desktop"
              >
                <Monitor className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDevice('tablet')}
                className={`p-2 rounded transition-colors ${
                  device === 'tablet' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Tablet"
              >
                <Tablet className="h-4 w-4" />
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`p-2 rounded transition-colors ${
                  device === 'mobile' 
                    ? 'bg-white dark:bg-gray-700 shadow-sm' 
                    : 'hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                title="Mobile"
              >
                <Smartphone className="h-4 w-4" />
              </button>
            </div>

            {/* Action Buttons */}
            <Button
              variant="outline"
              size="icon"
              onClick={refreshPreview}
              disabled={isBuilding}
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isBuilding ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={openInNewTab}
              title="Open in new tab"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 p-0 relative bg-gray-100 dark:bg-gray-900">
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
        <div className="h-full overflow-auto p-4">
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
      </CardContent>
    </Card>
  );
}