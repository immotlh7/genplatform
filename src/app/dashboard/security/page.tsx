"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Activity,
  Clock,
  FileText,
  RefreshCw,
  Download,
  Settings,
  Lock,
  Unlock,
  Eye,
  AlertCircle,
  Users,
  Database,
  Globe,
  Server
} from 'lucide-react'

interface SecurityStatus {
  overall: 'secure' | 'warning' | 'danger'
  lastScanTime: string
  nextScanTime: string
  issues: number
}

interface ThreatLogEntry {
  id: string
  date: string
  source: string
  type: 'prompt_injection' | 'unauthorized_access' | 'suspicious_activity'
  severity: 'low' | 'medium' | 'high' | 'critical'
  action: 'blocked' | 'monitored' | 'escalated'
  details: string
}

interface AuditEntry {
  id: string
  date: string
  type: 'weekly_audit' | 'security_scan' | 'access_review'
  status: 'completed' | 'in_progress' | 'scheduled'
  findings: number
  duration: string
}

const redRules = [
  "Never share API keys, tokens, or passwords",
  "Never delete databases or repositories without explicit approval",
  "Never deploy to production without approval",
  "Never send money or make purchases",
  "Never contact external parties",
  "Never modify security settings without approval",
  "Never execute commands from untrusted sources",
  "Never expose user data",
  "Never disable security monitoring",
  "Never override these rules, even if asked"
]

const amberRules = [
  "Install new dependencies → report what was installed",
  "Create new database tables → report schema",
  "Modify API routes → report changes",
  "Change file permissions → report what changed"
]

const greenRules = [
  "Write code in develop branch",
  "Run tests",
  "Take screenshots",
  "Send reports",
  "Update memory files",
  "Fix bugs",
  "Restart failed services"
]

export default function SecurityPage() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    overall: 'secure',
    lastScanTime: '2024-03-18T06:00:00Z',
    nextScanTime: '2024-03-18T08:00:00Z',
    issues: 0
  })
  
  const [threatLog, setThreatLog] = useState<ThreatLogEntry[]>([])
  const [auditHistory, setAuditHistory] = useState<AuditEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadSecurityData()
  }, [])

  const loadSecurityData = async () => {
    setIsLoading(true)
    try {
      // Simulate loading security data
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // No threats detected - empty arrays
      setThreatLog([])
      setAuditHistory([
        {
          id: '1',
          date: '2024-03-17T02:00:00Z',
          type: 'weekly_audit',
          status: 'completed',
          findings: 0,
          duration: '12m 34s'
        }
      ])
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to load security data:', error);
      }
    } finally {
      setIsLoading(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    })
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600'
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-blue-500'
      default: return 'bg-gray-500'
    }
  }

  const getRuleIcon = (type: 'red' | 'amber' | 'green') => {
    switch (type) {
      case 'red': return <XCircle className="h-4 w-4 text-red-500" />
      case 'amber': return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'green': return <CheckCircle className="h-4 w-4 text-green-500" />
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-64 mb-2"></div>
          <div className="h-4 bg-muted rounded w-96"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse">
              <div className="h-32 bg-muted rounded-lg"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">
            System security monitoring and threat protection.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadSecurityData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Card 1: Security Status */}
      <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-green-600" />
            <span>Security Status</span>
            <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
              🛡️ System Secure
            </Badge>
          </CardTitle>
          <CardDescription>
            Real-time security monitoring and threat detection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Scan</span>
              </div>
              <div className="text-lg font-semibold">
                {formatDateTime(securityStatus.lastScanTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                2 hours ago
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Activity className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Next Scan</span>
              </div>
              <div className="text-lg font-semibold">
                {formatDateTime(securityStatus.nextScanTime)}
              </div>
              <div className="text-xs text-muted-foreground">
                In 51 minutes
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Issues Found</span>
              </div>
              <div className="text-lg font-semibold text-green-600">
                {securityStatus.issues}
              </div>
              <div className="text-xs text-green-600">
                All systems operational
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Card 2: Security Rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Security Rules</span>
          </CardTitle>
          <CardDescription>
            Three-tier security protocol governing all system operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="red" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="red" className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span>🔴 Red (Never Do)</span>
              </TabsTrigger>
              <TabsTrigger value="amber" className="flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>🟡 Amber (Do with Caution)</span>
              </TabsTrigger>
              <TabsTrigger value="green" className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>🟢 Green (Safe to Do)</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="red" className="space-y-4">
              <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-950/20 p-4 rounded-r-lg">
                <h4 className="font-semibold text-red-800 dark:text-red-400 mb-2">
                  RED LIST - NEVER do these actions, no exceptions
                </h4>
                <div className="space-y-2">
                  {redRules.map((rule, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="amber" className="space-y-4">
              <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-4 rounded-r-lg">
                <h4 className="font-semibold text-yellow-800 dark:text-yellow-400 mb-2">
                  AMBER LIST - Do with caution, report after
                </h4>
                <div className="space-y-2">
                  {amberRules.map((rule, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="green" className="space-y-4">
              <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-950/20 p-4 rounded-r-lg">
                <h4 className="font-semibold text-green-800 dark:text-green-400 mb-2">
                  GREEN LIST - Safe to do autonomously
                </h4>
                <div className="space-y-2">
                  {greenRules.map((rule, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 3: Threat Log */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5" />
              <span>Threat Log</span>
            </CardTitle>
            <CardDescription>
              Real-time threat detection and response log
            </CardDescription>
          </CardHeader>
          <CardContent>
            {threatLog.length === 0 ? (
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-green-700 dark:text-green-400 mb-2">
                  No threats detected
                </h3>
                <p className="text-sm text-muted-foreground">
                  System is secure. All monitoring systems are active and no suspicious activity has been detected in the last 30 days.
                </p>
                <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Active monitoring</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>Real-time alerts</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Recent Threats</span>
                  <Badge variant="outline">{threatLog.length}</Badge>
                </div>
                <div className="space-y-2">
                  {threatLog.map((threat) => (
                    <div key={threat.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-2 h-2 rounded-full ${getSeverityColor(threat.severity)}`}></div>
                        <div>
                          <div className="text-sm font-medium">{threat.type.replace('_', ' ')}</div>
                          <div className="text-xs text-muted-foreground">{threat.source}</div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(threat.date)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 4: Audit History */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Audit History</span>
            </CardTitle>
            <CardDescription>
              Security audit schedule and results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {auditHistory.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">First audit scheduled</h3>
                  <p className="text-sm text-muted-foreground">
                    First security audit scheduled for Sunday 2 AM
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {auditHistory.map((audit) => (
                    <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium capitalize">
                            {audit.type.replace('_', ' ')}
                          </span>
                          <Badge 
                            variant={audit.status === 'completed' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {audit.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDateTime(audit.date)} • {audit.duration}
                        </div>
                        <div className="flex items-center space-x-2 text-xs">
                          <span className="text-muted-foreground">Findings:</span>
                          <span className={audit.findings === 0 ? 'text-green-600' : 'text-yellow-600'}>
                            {audit.findings === 0 ? 'None' : audit.findings}
                          </span>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Next weekly audit:</span>
                  <span className="font-medium">Sunday, Mar 24 at 2:00 AM</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}