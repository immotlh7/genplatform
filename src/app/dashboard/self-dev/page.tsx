'use client';

import { useState, useEffect } from 'react';
import { FileUploader } from '@/components/self-dev/FileUploader';
import { ExecutionMonitor } from '@/components/self-dev/ExecutionMonitor';
import { Bot, Brain, FileText, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface UploadedFile {
  fileId: string;
  fileName: string;
  rawContent: string;
  uploadedAt: string;
}

interface AnalysisResult {
  fileId: string;
  analysis: any;
  analyzedAt: string;
  status: string;
}

export default function SelfDevPage() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (fileData: UploadedFile) => {
    setUploadedFile(fileData);
    setAnalysisResult(null);
    setError(null);
    
    // Automatically start analysis
    await analyzeFile(fileData);
  };

  const analyzeFile = async (fileData: UploadedFile) => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const response = await fetch('/api/self-dev/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId: fileData.fileId,
          content: fileData.rawContent
        })
      });
      
      if (!response.ok) {
        throw new Error('Analysis failed');
      }
      
      const result = await response.json();
      setAnalysisResult(result);
    } catch (err) {
      setError('Failed to analyze file');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const startExecution = async () => {
    if (!analysisResult?.analysis) return;
    
    setIsExecuting(true);
    setError(null);
    
    try {
      // Execute tasks in order
      for (const message of analysisResult.analysis.messages) {
        for (const task of message.microTasks) {
          // Send task to Developer agent
          const response = await fetch('/api/self-dev/execute', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              task,
              projectContext: `Working on: ${message.summary}`
            })
          });
          
          if (!response.ok) {
            throw new Error(`Failed to execute task ${task.taskId}`);
          }
          
          // Wait a bit between tasks to avoid overwhelming the agent
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
        // After each message, send build command
        await sendBuildCommand();
      }
    } catch (err) {
      setError('Execution failed');
      console.error('Execution error:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const sendBuildCommand = async () => {
    // Send build and restart command to Developer
    await fetch('/api/self-dev/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: {
          taskId: 'build_task',
          action: 'build',
          filePath: 'N/A',
          description: 'Build and restart the application',
          specificChanges: 'Run: cd /root/genplatform && npm run build && pm2 restart genplatform-app',
          estimatedMinutes: 2
        },
        projectContext: 'Build checkpoint'
      })
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Self-Development System</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload task files and watch as AI agents automatically develop GenPlatform.ai
        </p>
      </div>
      
      {/* Two-Agent Architecture Explanation */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Brain className="h-8 w-8 text-blue-600" />
            <div>
              <h3 className="text-lg font-semibold">Orchestrator Agent</h3>
              <p className="text-sm text-gray-500">Claude Sonnet - Fast Analysis</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Reads entire task files (100+ tasks)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Decomposes into micro-tasks
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Manages execution flow
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Never touches code directly
            </li>
          </ul>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bot className="h-8 w-8 text-purple-600" />
            <div>
              <h3 className="text-lg font-semibold">Developer Agent</h3>
              <p className="text-sm text-gray-500">Claude Opus on OpenClaw</p>
            </div>
          </div>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Receives one micro-task at a time
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Executes code changes
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Runs builds and tests
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-500 mt-0.5">•</span>
              Clean context (200 tokens vs 4000)
            </li>
          </ul>
        </div>
      </div>
      
      {/* File Upload */}
      {!uploadedFile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Upload Task File</h2>
          <FileUploader onUploadComplete={handleFileUpload} />
        </div>
      )}
      
      {/* File Info & Analysis Status */}
      {uploadedFile && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-gray-400" />
              <div>
                <h3 className="font-semibold">{uploadedFile.fileName}</h3>
                <p className="text-sm text-gray-500">
                  Uploaded at {new Date(uploadedFile.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
            
            {isAnalyzing && (
              <div className="flex items-center gap-2 text-blue-600">
                <Clock className="h-5 w-5 animate-pulse" />
                <span>Analyzing...</span>
              </div>
            )}
            
            {analysisResult && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span>Analysis Complete</span>
              </div>
            )}
          </div>
          
          {analysisResult && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{analysisResult.analysis.totalMessages}</p>
                  <p className="text-sm text-gray-500">Messages</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysisResult.analysis.totalMicroTasks}</p>
                  <p className="text-sm text-gray-500">Micro-tasks</p>
                </div>
                <div>
                  <p className="text-2xl font-bold">{analysisResult.analysis.executionPlan?.batches?.length || 0}</p>
                  <p className="text-sm text-gray-500">Batches</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Execution Monitor */}
      {analysisResult && (
        <ExecutionMonitor
          fileId={uploadedFile!.fileId}
          analysis={analysisResult.analysis}
          onExecute={startExecution}
          isExecuting={isExecuting}
        />
      )}
      
      {/* Error Display */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="h-5 w-5" />
            <span>{error}</span>
          </div>
        </div>
      )}
    </div>
  );
}