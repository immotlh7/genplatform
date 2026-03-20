'use client';

import { useState, useCallback } from 'react';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { useDropzone } from 'react-dropzone';

interface FileUploaderProps {
  onUploadComplete: (data: { fileId: string; fileName: string }) => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/self-dev/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      setUploadedFile(file.name);
      onUploadComplete(data);
      
      // Auto-analyze after upload
      const analyzeResponse = await fetch('/api/self-dev/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileId: data.fileId }),
      });

      if (!analyzeResponse.ok) {
        throw new Error('Analysis failed');
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      console.error('Upload error:', err);
    } finally {
      setUploading(false);
    }
  }, [onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/markdown': ['.md'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    disabled: uploading,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-4 text-center cursor-pointer
          transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-600 hover:border-gray-500'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
          ${uploadedFile ? 'bg-green-900/20 border-green-600' : 'bg-gray-800'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center space-y-2">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-300 border-t-blue-500" />
              <p className="text-xs text-gray-400">Uploading...</p>
            </>
          ) : uploadedFile ? (
            <>
              <Check className="h-8 w-8 text-green-500" />
              <p className="text-xs text-gray-300 font-medium">{uploadedFile}</p>
              <p className="text-xs text-gray-500">Drop new file to replace</p>
            </>
          ) : (
            <>
              <Upload className="h-8 w-8 text-gray-500" />
              <p className="text-xs text-gray-300">
                {isDragActive ? 'Drop file here' : 'Drag & drop task file'}
              </p>
              <p className="text-xs text-gray-500">or click to browse</p>
            </>
          )}
        </div>
      </div>
      
      {error && (
        <div className="mt-2 p-2 bg-red-900/20 border border-red-800 rounded flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}