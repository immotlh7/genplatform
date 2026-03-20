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
  const [analysisResult, setAnalysisResult] = useState<any>(null);

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
    setAnalysisResult(null);
    
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
      setAnalysisResult(analysisData.analysis);
      
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
      {!analysisResult && (
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
            className={`relative block w-full rounded-lg border-2 border-dashed p-12 text-center hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 cursor-pointer transition-colors ${
              dragActive ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-700'
            } ${(isUploading || isAnalyzing) ? 'opacity-50 cursor-not-allowed' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <Loader2 className="mx-auto h-12 w-12 text-gray-400 animate-spin" />
            ) : isAnalyzing ? (
              <Loader2 className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
            ) : (
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
            )}
            <span className="mt-2 block text-sm font-semibold text-gray-900 dark:text-gray-100">
              {isUploading ? 'Uploading...' : isAnalyzing ? 'Analyzing file... Decomposing into micro-tasks...' : 'Drop task file here or click to upload'}
            </span>
            <span className="mt-1 block text-xs text-gray-500 dark:text-gray-400">
              .md files only (e.g., PRIORITY-1.md)
            </span>
          </label>
        </form>
      )}
      
      {analysisResult && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            <h3 className="text-lg font-semibold text-green-900 dark:text-green-100">Analysis Complete</h3>
          </div>
          <p className="text-green-800 dark:text-green-200">
            📄 {analysisResult.fileName || 'Task file'} → {analysisResult.totalMessages} messages → {analysisResult.totalMicroTasks} micro-tasks → {Math.ceil(analysisResult.totalMicroTasks / 5)} batches
          </p>
        </div>
      )}
      
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}
    </div>
  );
}