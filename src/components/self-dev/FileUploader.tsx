'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react';

interface FileUploaderProps {
  onUploadComplete: (fileData: any) => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpload, setLastUpload] = useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    setError(null);
    
    if (!file.name.endsWith('.md')) {
      setError('Only .md files are allowed');
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload file
      const formData = new FormData();
      formData.append('file', file);
      
      const uploadResponse = await fetch('/api/self-dev/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }
      
      const uploadData = await uploadResponse.json();
      setIsUploading(false);
      setIsAnalyzing(true);
      
      // Analyze file
      const analyzeResponse = await fetch('/api/self-dev/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: uploadData.fileId,
          content: uploadData.rawContent
        })
      });
      
      if (!analyzeResponse.ok) {
        throw new Error('Analysis failed');
      }
      
      const analysisData = await analyzeResponse.json();
      setLastUpload(uploadData.fileName);
      
      // Call parent callback
      onUploadComplete({
        ...uploadData,
        analysis: analysisData.analysis
      });
      
    } catch (err) {
      setError('Failed to process file');
      console.error('File processing error:', err);
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="w-full">
      <form onDragEnter={handleDrag} onSubmit={(e) => e.preventDefault()}>
        <input
          type="file"
          id="file-upload"
          accept=".md"
          onChange={handleChange}
          className="hidden"
          disabled={isUploading || isAnalyzing}
        />
        <label
          htmlFor="file-upload"
          className={`relative block w-full rounded-lg border-2 border-dashed p-4 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-colors ${
            dragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
          } ${(isUploading || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {isUploading ? (
            <Loader2 className="mx-auto h-8 w-8 text-gray-400 animate-spin" />
          ) : isAnalyzing ? (
            <Loader2 className="mx-auto h-8 w-8 text-blue-500 animate-spin" />
          ) : lastUpload ? (
            <CheckCircle className="mx-auto h-8 w-8 text-green-500" />
          ) : (
            <Upload className="mx-auto h-8 w-8 text-gray-400" />
          )}
          <span className="mt-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            {isUploading ? 'Uploading...' : 
             isAnalyzing ? 'Analyzing...' : 
             lastUpload ? `Uploaded: ${lastUpload}` :
             'Drop .md file or click'}
          </span>
        </label>
      </form>
      
      {error && (
        <div className="mt-2 flex items-center gap-1 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}