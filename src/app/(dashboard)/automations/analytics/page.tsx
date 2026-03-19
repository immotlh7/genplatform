'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Clock, 
  AlertTriangle,
  Cpu,
  TrendingUp,
  CheckCircle2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface WorkflowMetrics {
  id: string;
  name: string;
  totalRuns: number;
  successRate: number;
  avgExecutionTime: number;
  lastRun: string;
  errorTypes: { [key: string]: number };
  dailyRuns: { date: string; success: number; failure: number }[];
  performanceData: { time: string; executionTime: number; resourceUsage: number }[];
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];

export default function WorkflowAnalyticsPage() {
  const [workflows, setWorkflows] = useState<WorkflowMetrics[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<string>('7d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWorkflowMetrics();
  }, [selectedWorkflow, timeRange]);

  const loadWorkflowMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock data for demonstration
      const mockData: WorkflowMetrics[] = [
        {
          id: '1',
          name: 'Daily Report Generation',
          totalRuns: 156,
          successRate: 95.5,
          avgExecutionTime: 45,
          lastRun: '2026-03-18T20:30:00Z',
          errorTypes: { 'API Timeout': 3, 'Data Missing': 2, 'Permission Error': 2 },
          dailyRuns: [
            { date: '2026-03-12', success: 18, failure: 1 },
            { date: '2026-03-13', success: 22, failure: 0 },
            { date: '2026-03-14', success: 20, failure: 2 },
            { date: '2026-03-15', success: 24, failure: 1 },
            { date: '2026-03-16', success: 21, failure: 0 },
            { date: '2026-03-17', success: 23, failure: 1 },
            { date: '2026-03-18', success: 25, failure: 0 }
          ],
          performanceData: [
            { time: '00:00', executionTime: 42, resourceUsage: 65 },
            { time: '04:00', executionTime: 38, resourceUsage: 58 },
            { time: '08:00', executionTime: 51, resourceUsage: 78 },
            { time: '12:00', executionTime: 47, resourceUsage: 72 },
            { time: '16:00', executionTime: 44, resourceUsage: 69 },
            { time: '20:00', executionTime: 49, resourceUsage: 75 }
          ]
        },
        {
          id: '2', 
          name: 'Data Sync Process',
          totalRuns: 89,
          successRate: 87.6,
          avgExecutionTime: 128,
          lastRun: '2026-03-18T19:45:00Z',
          errorTypes: { 'Network Error': 5, 'Rate Limit': 4, 'Data Validation': 2 },
          dailyRuns: [
            { date: '2026-03-12', success: 10, failure: 2 },
            { date: '2026-03-13', success: 12, failure: 1 },
            { date: '2026-03-14', success: 11, failure: 3 },
            { date: '2026-03-15', success: 13, failure: 1 },
            { date: '2026-03-16', success: 14, failure: 0 },
            { date: '2026-03-17', success: 12, failure: 2 },
            { date: '2026-03-18', success: 15, failure: 1 }
          ],
          performanceData: [
            { time: '00:00', executionTime: 125, resourceUsage: 82 },
            { time: '04:00', executionTime: 110, resourceUsage: 75 },
            { time: '08:00', executionTime: 145, resourceUsage: 92 },
            { time: '12:00', executionTime: 132, resourceUsage: 88 },
            { time: '16:00', executionTime: 118, resourceUsage: 78 },
            { time: '20:00', executionTime: 138, resourceUsage: 89 }
          ]
        }
      ];

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setWorkflows(mockData);
    } catch (error) {
      console.error('Failed to load workflow metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSelectedWorkflowData = () => {
    if (selectedWorkflow === 'all') {
      return workflows.reduce((acc, workflow) => ({
        ...acc,
        totalRuns: acc.totalRuns + workflow.totalRuns,
        successRate: workflows.length > 0 
          ? workflows.reduce((sum, w) => sum + w.successRate, 0) / workflows.length
          : 0,
        avgExecutionTime: workflows.length > 0
          ? workflows.reduce((sum, w) => sum + w.avgExecutionTime, 0) / workflows.length
          : 0
      }), { totalRuns: 0, successRate: 0, avgExecutionTime: 0 });
    }
    return workflows.find(w => w.id === selectedWorkflow) || workflows[0];
  };

  const selectedData = getSelectedWorkflowData();

  const getErrorDistributionData = () => {
    if (selectedWorkflow === 'all') {
      const allErrors = workflows.reduce((acc, workflow) => {
        Object.entries(workflow.errorTypes).forEach(([error, count]) => {
          acc[error] = (acc[error] || 0) + count;
        });
        return acc;
      }, {} as { [key: string]: number });
      
      return Object.entries(allErrors).map(([name, value]) => ({ name, value }));
    }
    
    const workflow = workflows.find(w => w.id === selectedWorkflow);
    return workflow 
      ? Object.entries(workflow.errorTypes).map(([name, value]) => ({ name, value }))
      : [];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Workflow Analytics</h1>
        <div className="flex gap-4">
          <select
            value={selectedWorkflow}
            onChange={(e) => setSelectedWorkflow(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="all">All Workflows</option>
            {workflows.map(workflow => (
              <option key={workflow.id} value={workflow.id}>
                {workflow.name}
              </option>
            ))}
          </select>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Runs</p>
              <p className="text-2xl font-bold">{selectedData.totalRuns?.toLocaleString() || 0}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Success Rate</p>
              <p className="text-2xl font-bold">{selectedData.successRate?.toFixed(1) || 0}%</p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Execution Time</p>
              <p className="text-2xl font-bold">{selectedData.avgExecutionTime?.toFixed(0) || 0}s</p>
            </div>
            <Clock className="h-8 w-8 text-orange-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Workflows</p>
              <p className="text-2xl font-bold">{workflows.length}</p>
            </div>
            <Cpu className="h-8 w-8 text-purple-600" />
          </div>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Success Rate Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Success Rate Trend</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedWorkflow !== 'all' && workflows.find(w => w.id === selectedWorkflow)?.dailyRuns || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="success" stroke="#10B981" strokeWidth={2} name="Successful Runs" />
                <Line type="monotone" dataKey="failure" stroke="#EF4444" strokeWidth={2} name="Failed Runs" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Error Distribution */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Error Analysis</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={getErrorDistributionData()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {getErrorDistributionData().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Performance Trends */}
        <Card className="p-6 xl:col-span-2">
          <h3 className="text-lg font-semibold mb-4">Performance & Resource Usage</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={selectedWorkflow !== 'all' && workflows.find(w => w.id === selectedWorkflow)?.performanceData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left" 
                  type="monotone" 
                  dataKey="executionTime" 
                  stroke="#3B82F6" 
                  strokeWidth={2} 
                  name="Execution Time (s)" 
                />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="resourceUsage" 
                  stroke="#8B5CF6" 
                  strokeWidth={2} 
                  name="Resource Usage (%)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Workflow List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Workflow Performance Summary</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Workflow
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Runs
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Success Rate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Avg Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Run
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {workflows.map((workflow) => (
                <tr key={workflow.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900">{workflow.name}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workflow.totalRuns.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      workflow.successRate >= 95 
                        ? 'bg-green-100 text-green-800'
                        : workflow.successRate >= 85
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {workflow.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {workflow.avgExecutionTime}s
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(workflow.lastRun).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}