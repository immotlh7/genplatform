'use client';

import { useState } from 'react';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
  onUploadComplete: (fileData: any) => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch('/api/self-dev/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      onUploadComplete(data);
    } catch (err) {
      setError('Failed to upload file');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
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
        />
        <label
          htmlFor="file-upload"
          className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-colors ${
            dragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
          } ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
            {isUploading ? 'Uploading...' : 'Drop task file here or click to upload'}
          </span>
          <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
            .md files only (e.g., PRIORITY-1.md)
          </span>
        </label>
      </form>
      
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}