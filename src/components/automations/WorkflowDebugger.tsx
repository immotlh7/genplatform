/**
 * Workflow Debugger Component
 * 
 * Provides advanced debugging capabilities for workflow execution including:
 * - Step-by-step execution tracing
 * - Variable inspection at each step
 * - Breakpoint management
 * - Debug replay functionality
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Play, 
  Pause, 
  SkipForward, 
  RotateCcw,
  Bug,
  Circle,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Code,
  Eye,
  Terminal,
  History,
  Download,
  Upload
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface DebugStep {
  id: string;
  name: string;
  type: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startTime?: Date;
  endTime?: Date;
  duration?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  logs: LogEntry[];
  breakpoint?: boolean;
}

interface LogEntry {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
}

interface DebugSession {
  id: string;
  workflowId: string;
  workflowName: string;
  startTime: Date;
  endTime?: Date;
  status: 'initializing' | 'running' | 'paused' | 'completed' | 'failed';
  currentStepIndex: number;
  steps: DebugStep[];
  variables: Record<string, any>;
  breakpoints: Set<string>;
  watchedVariables: Set<string>;
}

interface WorkflowDebuggerProps {
  workflowId: string;
  workflowName: string;
  onClose?: () => void;
}

export function WorkflowDebugger({ workflowId, workflowName, onClose }: WorkflowDebuggerProps) {
  const [session, setSession] = useState<DebugSession | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedStep, setSelectedStep] = useState<DebugStep | null>(null);
  const [variableFilter, setVariableFilter] = useState('');
  const [logFilter, setLogFilter] = useState('');
  const [replaySpeed, setReplaySpeed] = useState(1);
  const executionInterval = useRef<NodeJS.Timeout | null>(null);

  // Initialize debug session
  useEffect(() => {
    initializeDebugSession();
    return () => {
      if (executionInterval.current) {
        clearInterval(executionInterval.current);
      }
    };
  }, [workflowId]);

  const initializeDebugSession = async () => {
    // In a real implementation, this would fetch workflow definition and prepare debug environment
    const mockSession: DebugSession = {
      id: `debug-${Date.now()}`,
      workflowId,
      workflowName,
      startTime: new Date(),
      status: 'initializing',
      currentStepIndex: 0,
      steps: generateMockSteps(),
      variables: {
        workflowId,
        environment: 'debug',
        userId: 'debug-user',
        timestamp: new Date().toISOString()
      },
      breakpoints: new Set(['step-3', 'step-5']),
      watchedVariables: new Set(['userId', 'results'])
    };
    
    setSession(mockSession);
    setSelectedStep(mockSession.steps[0]);
  };

  const generateMockSteps = (): DebugStep[] => {
    return [
      {
        id: 'step-1',
        name: 'Initialize Workflow',
        type: 'system',
        status: 'pending',
        input: { workflowId, trigger: 'manual' },
        logs: []
      },
      {
        id: 'step-2',
        name: 'Fetch User Data',
        type: 'api',
        status: 'pending',
        input: { endpoint: '/api/users/current' },
        logs: []
      },
      {
        id: 'step-3',
        name: 'Process Data',
        type: 'transform',
        status: 'pending',
        input: { fields: ['name', 'email', 'role'] },
        logs: [],
        breakpoint: true
      },
      {
        id: 'step-4',
        name: 'Validate Results',
        type: 'condition',
        status: 'pending',
        input: { rules: [{ field: 'role', operator: 'equals', value: 'admin' }] },
        logs: []
      },
      {
        id: 'step-5',
        name: 'Send Notification',
        type: 'action',
        status: 'pending',
        input: { channel: 'email', template: 'workflow-complete' },
        logs: [],
        breakpoint: true
      },
      {
        id: 'step-6',
        name: 'Log Results',
        type: 'system',
        status: 'pending',
        input: { level: 'info', destination: 'analytics' },
        logs: []
      }
    ];
  };

  const handlePlay = () => {
    if (!session) return;
    
    setIsPlaying(true);
    setSession({ ...session, status: 'running' });
    
    // Start step execution
    executionInterval.current = setInterval(() => {
      executeNextStep();
    }, 1000 / replaySpeed);
  };

  const handlePause = () => {
    setIsPlaying(false);
    if (session) {
      setSession({ ...session, status: 'paused' });
    }
    if (executionInterval.current) {
      clearInterval(executionInterval.current);
    }
  };

  const executeNextStep = () => {
    if (!session) return;
    
    const currentStep = session.steps[session.currentStepIndex];
    
    // Check for breakpoint
    if (session.breakpoints.has(currentStep.id) && isPlaying) {
      handlePause();
      return;
    }
    
    // Execute step
    const updatedStep = simulateStepExecution(currentStep);
    const updatedSteps = [...session.steps];
    updatedSteps[session.currentStepIndex] = updatedStep;
    
    // Update variables based on step output
    const updatedVariables = {
      ...session.variables,
      [`step_${currentStep.id}_output`]: updatedStep.output
    };
    
    // Move to next step or complete
    const nextIndex = session.currentStepIndex + 1;
    const isComplete = nextIndex >= session.steps.length;
    
    setSession({
      ...session,
      currentStepIndex: isComplete ? session.currentStepIndex : nextIndex,
      steps: updatedSteps,
      variables: updatedVariables,
      status: isComplete ? 'completed' : 'running',
      endTime: isComplete ? new Date() : undefined
    });
    
    if (isComplete) {
      handlePause();
    }
  };

  const simulateStepExecution = (step: DebugStep): DebugStep => {
    const startTime = new Date();
    const logs: LogEntry[] = [
      {
        timestamp: startTime,
        level: 'info',
        message: `Executing step: ${step.name}`,
        data: { input: step.input }
      }
    ];
    
    // Simulate some processing
    const duration = Math.random() * 500 + 100;
    const endTime = new Date(startTime.getTime() + duration);
    
    // Simulate output based on step type
    let output: Record<string, any> = {};
    let status: DebugStep['status'] = 'completed';
    let error: DebugStep['error'] | undefined;
    
    switch (step.type) {
      case 'api':
        output = {
          data: { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
          status: 200
        };
        logs.push({
          timestamp: endTime,
          level: 'debug',
          message: 'API response received',
          data: output
        });
        break;
        
      case 'transform':
        output = {
          transformed: { userName: 'John Doe', userEmail: 'john@example.com', isAdmin: true }
        };
        logs.push({
          timestamp: endTime,
          level: 'info',
          message: 'Data transformation complete'
        });
        break;
        
      case 'condition':
        output = { result: true, matched: ['rule-1'] };
        logs.push({
          timestamp: endTime,
          level: 'info',
          message: 'Condition evaluated to true'
        });
        break;
        
      case 'action':
        if (Math.random() > 0.8) {
          status = 'failed';
          error = {
            message: 'Failed to send notification',
            code: 'SMTP_ERROR',
            stack: 'Error: Connection timeout\n  at SMTPClient.send\n  at NotificationService.sendEmail'
          };
          logs.push({
            timestamp: endTime,
            level: 'error',
            message: error.message,
            data: { error }
          });
        } else {
          output = { messageId: 'msg-123', sentAt: endTime.toISOString() };
          logs.push({
            timestamp: endTime,
            level: 'info',
            message: 'Notification sent successfully'
          });
        }
        break;
        
      default:
        output = { success: true };
    }
    
    return {
      ...step,
      status,
      startTime,
      endTime,
      duration,
      output,
      error,
      logs
    };
  };

  const handleStepForward = () => {
    if (!session || session.currentStepIndex >= session.steps.length - 1) return;
    executeNextStep();
  };

  const handleReset = () => {
    handlePause();
    initializeDebugSession();
  };

  const toggleBreakpoint = (stepId: string) => {
    if (!session) return;
    
    const newBreakpoints = new Set(session.breakpoints);
    if (newBreakpoints.has(stepId)) {
      newBreakpoints.delete(stepId);
    } else {
      newBreakpoints.add(stepId);
    }
    
    setSession({ ...session, breakpoints: newBreakpoints });
  };

  const toggleWatchVariable = (varName: string) => {
    if (!session) return;
    
    const newWatched = new Set(session.watchedVariables);
    if (newWatched.has(varName)) {
      newWatched.delete(varName);
    } else {
      newWatched.add(varName);
    }
    
    setSession({ ...session, watchedVariables: newWatched });
  };

  const exportDebugSession = () => {
    if (!session) return;
    
    const exportData = {
      session: {
        ...session,
        breakpoints: Array.from(session.breakpoints),
        watchedVariables: Array.from(session.watchedVariables)
      },
      timestamp: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-session-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStepIcon = (step: DebugStep) => {
    switch (step.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Circle className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'skipped':
        return <AlertTriangle className="w-4 h-4 text-gray-400" />;
      default:
        return <Circle className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!session) {
    return <div>Loading debugger...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white border-b">
        <div className="flex items-center gap-3">
          <Bug className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold">Workflow Debugger</h2>
          <Badge variant="outline">{workflowName}</Badge>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Playback controls */}
          <Button
            size="sm"
            variant="outline"
            onClick={handleReset}
            disabled={isPlaying}
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
          
          {isPlaying ? (
            <Button size="sm" onClick={handlePause}>
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={handlePlay}
              disabled={session.status === 'completed'}
            >
              <Play className="w-4 h-4 mr-1" />
              Play
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleStepForward}
            disabled={isPlaying || session.currentStepIndex >= session.steps.length - 1}
          >
            <SkipForward className="w-4 h-4" />
          </Button>
          
          <select
            className="text-sm border rounded px-2 py-1"
            value={replaySpeed}
            onChange={(e) => setReplaySpeed(Number(e.target.value))}
          >
            <option value={0.5}>0.5x</option>
            <option value={1}>1x</option>
            <option value={2}>2x</option>
            <option value={4}>4x</option>
          </select>
          
          <Button
            size="sm"
            variant="outline"
            onClick={exportDebugSession}
          >
            <Download className="w-4 h-4" />
          </Button>
          
          {onClose && (
            <Button size="sm" variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Steps panel */}
        <div className="w-80 bg-white border-r flex flex-col">
          <div className="p-3 border-b">
            <h3 className="text-sm font-medium">Execution Steps</h3>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-3 space-y-2">
              {session.steps.map((step, index) => (
                <div
                  key={step.id}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded cursor-pointer transition-colors",
                    selectedStep?.id === step.id && "bg-gray-100",
                    index === session.currentStepIndex && "ring-2 ring-blue-500"
                  )}
                  onClick={() => setSelectedStep(step)}
                >
                  <button
                    className={cn(
                      "w-4 h-4 rounded-full border-2 transition-colors",
                      session.breakpoints.has(step.id) 
                        ? "bg-red-500 border-red-500" 
                        : "border-gray-300"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleBreakpoint(step.id);
                    }}
                  />
                  {getStepIcon(step)}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{step.name}</div>
                    <div className="text-xs text-gray-500">{step.type}</div>
                  </div>
                  {step.duration && (
                    <div className="text-xs text-gray-400">
                      {step.duration.toFixed(0)}ms
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
        
        {/* Details panel */}
        <div className="flex-1 flex flex-col">
          {selectedStep ? (
            <Tabs defaultValue="details" className="flex-1 flex flex-col">
              <TabsList className="w-full justify-start rounded-none border-b">
                <TabsTrigger value="details">
                  <Eye className="w-4 h-4 mr-1" />
                  Details
                </TabsTrigger>
                <TabsTrigger value="variables">
                  <Code className="w-4 h-4 mr-1" />
                  Variables
                </TabsTrigger>
                <TabsTrigger value="logs">
                  <Terminal className="w-4 h-4 mr-1" />
                  Logs
                </TabsTrigger>
                <TabsTrigger value="timeline">
                  <History className="w-4 h-4 mr-1" />
                  Timeline
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="flex-1 overflow-auto p-4">
                <div className="space-y-4">
                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-2">Step Information</h4>
                    <dl className="space-y-1 text-sm">
                      <div className="flex">
                        <dt className="w-24 text-gray-500">ID:</dt>
                        <dd className="font-mono">{selectedStep.id}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-24 text-gray-500">Type:</dt>
                        <dd>{selectedStep.type}</dd>
                      </div>
                      <div className="flex">
                        <dt className="w-24 text-gray-500">Status:</dt>
                        <dd>
                          <Badge
                            variant={
                              selectedStep.status === 'completed' ? 'success' :
                              selectedStep.status === 'failed' ? 'destructive' :
                              selectedStep.status === 'running' ? 'default' :
                              'secondary'
                            }
                          >
                            {selectedStep.status}
                          </Badge>
                        </dd>
                      </div>
                      {selectedStep.duration && (
                        <div className="flex">
                          <dt className="w-24 text-gray-500">Duration:</dt>
                          <dd>{selectedStep.duration.toFixed(2)}ms</dd>
                        </div>
                      )}
                    </dl>
                  </Card>
                  
                  <Card className="p-4">
                    <h4 className="text-sm font-medium mb-2">Input</h4>
                    <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                      {JSON.stringify(selectedStep.input, null, 2)}
                    </pre>
                  </Card>
                  
                  {selectedStep.output && (
                    <Card className="p-4">
                      <h4 className="text-sm font-medium mb-2">Output</h4>
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(selectedStep.output, null, 2)}
                      </pre>
                    </Card>
                  )}
                  
                  {selectedStep.error && (
                    <Card className="p-4 border-red-200 bg-red-50">
                      <h4 className="text-sm font-medium mb-2 text-red-800">Error</h4>
                      <div className="text-sm text-red-700">{selectedStep.error.message}</div>
                      {selectedStep.error.stack && (
                        <pre className="text-xs mt-2 bg-red-100 p-2 rounded overflow-auto">
                          {selectedStep.error.stack}
                        </pre>
                      )}
                    </Card>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="variables" className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Filter variables..."
                    className="w-full px-3 py-2 border rounded"
                    value={variableFilter}
                    onChange={(e) => setVariableFilter(e.target.value)}
                  />
                  
                  <div className="space-y-2">
                    {Object.entries(session.variables)
                      .filter(([key]) => 
                        key.toLowerCase().includes(variableFilter.toLowerCase())
                      )
                      .map(([key, value]) => (
                        <Card key={key} className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <code className="text-sm font-medium">{key}</code>
                                <button
                                  className={cn(
                                    "text-xs px-2 py-0.5 rounded",
                                    session.watchedVariables.has(key)
                                      ? "bg-blue-100 text-blue-700"
                                      : "bg-gray-100 text-gray-600"
                                  )}
                                  onClick={() => toggleWatchVariable(key)}
                                >
                                  {session.watchedVariables.has(key) ? 'Watching' : 'Watch'}
                                </button>
                              </div>
                              <pre className="text-xs mt-1 text-gray-600 overflow-auto">
                                {JSON.stringify(value, null, 2)}
                              </pre>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="logs" className="flex-1 overflow-auto p-4">
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Filter logs..."
                    className="w-full px-3 py-2 border rounded"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                  />
                  
                  <ScrollArea className="h-96">
                    <div className="space-y-1">
                      {selectedStep.logs
                        .filter(log => 
                          log.message.toLowerCase().includes(logFilter.toLowerCase())
                        )
                        .map((log, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex gap-2 p-2 text-xs font-mono rounded",
                              log.level === 'error' && "bg-red-50",
                              log.level === 'warn' && "bg-yellow-50",
                              log.level === 'debug' && "bg-gray-50"
                            )}
                          >
                            <span className="text-gray-500 whitespace-nowrap">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                            <span
                              className={cn(
                                "uppercase font-semibold w-12",
                                log.level === 'error' && "text-red-600",
                                log.level === 'warn' && "text-yellow-600",
                                log.level === 'info' && "text-blue-600",
                                log.level === 'debug' && "text-gray-600"
                              )}
                            >
                              {log.level}
                            </span>
                            <span className="flex-1">{log.message}</span>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </div>
              </TabsContent>
              
              <TabsContent value="timeline" className="flex-1 overflow-auto p-4">
                <div className="relative">
                  {session.steps.map((step, index) => (
                    <div key={step.id} className="flex gap-4 mb-4">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center",
                          step.status === 'completed' && "bg-green-100",
                          step.status === 'failed' && "bg-red-100",
                          step.status === 'running' && "bg-blue-100",
                          step.status === 'pending' && "bg-gray-100"
                        )}>
                          {index + 1}
                        </div>
                        {index < session.steps.length - 1 && (
                          <div className={cn(
                            "w-0.5 flex-1 mt-2",
                            step.status !== 'pending' ? "bg-gray-300" : "bg-gray-200"
                          )} />
                        )}
                      </div>
                      
                      <div className="flex-1 pb-4">
                        <h4 className="font-medium">{step.name}</h4>
                        {step.startTime && (
                          <div className="text-sm text-gray-500 mt-1">
                            Started: {step.startTime.toLocaleTimeString()}
                            {step.endTime && (
                              <span className="ml-2">
                                Duration: {step.duration?.toFixed(0)}ms
                              </span>
                            )}
                          </div>
                        )}
                        {step.error && (
                          <div className="text-sm text-red-600 mt-1">
                            Error: {step.error.message}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Select a step to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}