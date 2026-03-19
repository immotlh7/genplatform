/**
 * Workflow Security Module
 * 
 * Provides security scanning and validation for workflows:
 * - Vulnerability detection in workflows
 * - Permission auditing
 * - Secrets management integration
 * - Security best practices validation
 */

import { z } from 'zod';
import crypto from 'crypto';

export interface SecurityScanResult {
  workflowId: string;
  scanId: string;
  timestamp: Date;
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  vulnerabilities: Vulnerability[];
  permissions: PermissionAudit[];
  secrets: SecretAudit[];
  bestPractices: BestPracticeViolation[];
  score: number; // 0-100, higher is more secure
}

export interface Vulnerability {
  id: string;
  type: 'injection' | 'exposure' | 'misconfiguration' | 'outdated_dependency' | 'weak_crypto' | 'hardcoded_secret';
  severity: 'low' | 'medium' | 'high' | 'critical';
  stepId: string;
  description: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration ID
  cvss?: number; // CVSS score
}

export interface PermissionAudit {
  stepId: string;
  resource: string;
  permissions: string[];
  risk: 'low' | 'medium' | 'high';
  overprivileged: boolean;
  recommendation?: string;
}

export interface SecretAudit {
  stepId: string;
  type: 'hardcoded' | 'exposed' | 'weak' | 'unencrypted';
  location: string;
  risk: 'high' | 'critical';
  recommendation: string;
}

export interface BestPracticeViolation {
  practice: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  stepIds: string[];
  recommendation: string;
}

// Patterns for detecting sensitive data
const SENSITIVE_PATTERNS = {
  apiKey: /(?:api[_-]?key|apikey)[\s:=]+["']?([a-zA-Z0-9_\-]+)["']?/gi,
  awsKey: /(?:AKIA|ASIA|AROA|AIDA)([A-Z0-9]{16})/g,
  privateKey: /-----BEGIN\s+(?:RSA\s+)?PRIVATE\s+KEY-----/g,
  connectionString: /(?:mongodb|postgres|mysql|redis):\/\/[^:\s]+:[^@\s]+@[^:\s]+/gi,
  jwtToken: /eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
  githubToken: /gh[pousr]_[a-zA-Z0-9]{36}/g,
  slackToken: /xox[baprs]-[0-9a-zA-Z-]+/g,
  genericSecret: /(?:password|passwd|pwd|secret|token)[\s:=]+["']?([^\s"']+)["']?/gi
};

// Common injection patterns
const INJECTION_PATTERNS = {
  sqlInjection: /(\b(union|select|insert|update|delete|drop|create)\b.*\b(from|into|where|table)\b)|(-{2}|\/\*|\*\/)/gi,
  commandInjection: /([;&|`$]|\$\(|\||&&|\|\|)/g,
  xss: /<script[^>]*>|javascript:|on\w+\s*=/gi,
  pathTraversal: /\.\.[\/\\]|\.\.%2[fF]|\.\.%5[cC]/g,
  ldapInjection: /[*()\\\/\x00]/g
};

export class WorkflowSecurityScanner {
  private scanId: string;

  constructor() {
    this.scanId = crypto.randomUUID();
  }

  /**
   * Perform comprehensive security scan on a workflow
   */
  async scanWorkflow(workflow: WorkflowDefinition): Promise<SecurityScanResult> {
    const vulnerabilities: Vulnerability[] = [];
    const permissions: PermissionAudit[] = [];
    const secrets: SecretAudit[] = [];
    const bestPractices: BestPracticeViolation[] = [];

    // Scan each step
    for (const step of workflow.steps) {
      vulnerabilities.push(...await this.scanForVulnerabilities(step));
      permissions.push(...await this.auditPermissions(step));
      secrets.push(...await this.scanForSecrets(step));
    }

    // Check workflow-level best practices
    bestPractices.push(...this.checkBestPractices(workflow));

    // Calculate overall risk and score
    const { risk, score } = this.calculateRiskScore(vulnerabilities, permissions, secrets, bestPractices);

    return {
      workflowId: workflow.id,
      scanId: this.scanId,
      timestamp: new Date(),
      overallRisk: risk,
      vulnerabilities,
      permissions,
      secrets,
      bestPractices,
      score
    };
  }

  /**
   * Scan for vulnerabilities in a workflow step
   */
  private async scanForVulnerabilities(step: WorkflowStep): Promise<Vulnerability[]> {
    const vulnerabilities: Vulnerability[] = [];

    // Check for injection vulnerabilities
    const injectionVulns = this.checkInjectionVulnerabilities(step);
    vulnerabilities.push(...injectionVulns);

    // Check for data exposure
    const exposureVulns = this.checkDataExposure(step);
    vulnerabilities.push(...exposureVulns);

    // Check for misconfigurations
    const misconfigVulns = this.checkMisconfigurations(step);
    vulnerabilities.push(...misconfigVulns);

    // Check for weak cryptography
    if (step.config?.encryption) {
      const cryptoVulns = this.checkCryptography(step);
      vulnerabilities.push(...cryptoVulns);
    }

    return vulnerabilities;
  }

  /**
   * Check for injection vulnerabilities
   */
  private checkInjectionVulnerabilities(step: WorkflowStep): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const stepData = JSON.stringify(step.config);

    // SQL Injection
    if (INJECTION_PATTERNS.sqlInjection.test(stepData)) {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        type: 'injection',
        severity: 'high',
        stepId: step.id,
        description: 'Potential SQL injection vulnerability detected',
        recommendation: 'Use parameterized queries or prepared statements',
        cwe: 'CWE-89',
        cvss: 7.5
      });
    }

    // Command Injection
    if (step.type === 'script' || step.type === 'command') {
      if (INJECTION_PATTERNS.commandInjection.test(stepData)) {
        vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'injection',
          severity: 'critical',
          stepId: step.id,
          description: 'Potential command injection vulnerability detected',
          recommendation: 'Sanitize inputs and use safe command execution methods',
          cwe: 'CWE-78',
          cvss: 9.8
        });
      }
    }

    // XSS (if step generates web content)
    if (step.type === 'template' || step.config?.output?.includes('html')) {
      if (INJECTION_PATTERNS.xss.test(stepData)) {
        vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'injection',
          severity: 'medium',
          stepId: step.id,
          description: 'Potential XSS vulnerability in template generation',
          recommendation: 'Escape all user inputs in HTML context',
          cwe: 'CWE-79',
          cvss: 6.1
        });
      }
    }

    // Path Traversal
    if (step.config?.filePath || step.config?.directory) {
      if (INJECTION_PATTERNS.pathTraversal.test(stepData)) {
        vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'injection',
          severity: 'high',
          stepId: step.id,
          description: 'Potential path traversal vulnerability',
          recommendation: 'Validate and sanitize file paths',
          cwe: 'CWE-22',
          cvss: 7.5
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Check for data exposure vulnerabilities
   */
  private checkDataExposure(step: WorkflowStep): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    // Check if sensitive data is logged
    if (step.config?.logging?.level === 'debug' && step.type === 'api') {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        type: 'exposure',
        severity: 'medium',
        stepId: step.id,
        description: 'Sensitive data may be exposed in debug logs',
        recommendation: 'Disable debug logging in production or redact sensitive fields',
        cwe: 'CWE-532'
      });
    }

    // Check for unencrypted data transmission
    if (step.type === 'webhook' || step.type === 'api') {
      const url = step.config?.url || step.config?.endpoint || '';
      if (url.startsWith('http://') && !url.includes('localhost')) {
        vulnerabilities.push({
          id: crypto.randomUUID(),
          type: 'exposure',
          severity: 'high',
          stepId: step.id,
          description: 'Unencrypted data transmission detected',
          recommendation: 'Use HTTPS for all external communications',
          cwe: 'CWE-319',
          cvss: 7.4
        });
      }
    }

    // Check for sensitive data in URLs
    if (step.config?.url && /[?&](password|token|key|secret)=/i.test(step.config.url)) {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        type: 'exposure',
        severity: 'high',
        stepId: step.id,
        description: 'Sensitive data exposed in URL parameters',
        recommendation: 'Move sensitive data to request headers or body',
        cwe: 'CWE-598',
        cvss: 7.5
      });
    }

    return vulnerabilities;
  }

  /**
   * Check for misconfigurations
   */
  private checkMisconfigurations(step: WorkflowStep): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];

    // Check for missing authentication
    if ((step.type === 'api' || step.type === 'webhook') && !step.config?.auth) {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        type: 'misconfiguration',
        severity: 'medium',
        stepId: step.id,
        description: 'API endpoint accessed without authentication',
        recommendation: 'Implement proper authentication for API calls',
        cwe: 'CWE-306'
      });
    }

    // Check for overly permissive CORS
    if (step.config?.cors === '*' || step.config?.cors?.origin === '*') {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        type: 'misconfiguration',
        severity: 'medium',
        stepId: step.id,
        description: 'Overly permissive CORS configuration',
        recommendation: 'Restrict CORS to specific trusted domains',
        cwe: 'CWE-942',
        cvss: 5.3
      });
    }

    // Check for missing rate limiting
    if (step.type === 'api' && !step.config?.rateLimit) {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        type: 'misconfiguration',
        severity: 'low',
        stepId: step.id,
        description: 'No rate limiting configured for API endpoint',
        recommendation: 'Implement rate limiting to prevent abuse',
        cwe: 'CWE-770'
      });
    }

    return vulnerabilities;
  }

  /**
   * Check cryptography usage
   */
  private checkCryptography(step: WorkflowStep): Vulnerability[] {
    const vulnerabilities: Vulnerability[] = [];
    const config = step.config?.encryption || {};

    // Check for weak algorithms
    const weakAlgorithms = ['md5', 'sha1', 'des', 'rc4'];
    if (weakAlgorithms.includes(config.algorithm?.toLowerCase())) {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        type: 'weak_crypto',
        severity: 'high',
        stepId: step.id,
        description: `Weak cryptographic algorithm used: ${config.algorithm}`,
        recommendation: 'Use strong algorithms like AES-256, SHA-256, or higher',
        cwe: 'CWE-327',
        cvss: 7.5
      });
    }

    // Check for insufficient key length
    if (config.keyLength && config.keyLength < 256) {
      vulnerabilities.push({
        id: crypto.randomUUID(),
        type: 'weak_crypto',
        severity: 'medium',
        stepId: step.id,
        description: `Insufficient key length: ${config.keyLength} bits`,
        recommendation: 'Use key length of at least 256 bits',
        cwe: 'CWE-326'
      });
    }

    return vulnerabilities;
  }

  /**
   * Audit permissions for a step
   */
  private async auditPermissions(step: WorkflowStep): Promise<PermissionAudit[]> {
    const audits: PermissionAudit[] = [];

    if (step.config?.permissions) {
      const requiredPerms = this.getRequiredPermissions(step);
      const grantedPerms = step.config.permissions;

      // Check for overprivileged access
      const overprivileged = grantedPerms.some(
        (perm: string) => !requiredPerms.includes(perm)
      );

      audits.push({
        stepId: step.id,
        resource: step.config.resource || 'unknown',
        permissions: grantedPerms,
        risk: overprivileged ? 'high' : 'low',
        overprivileged,
        recommendation: overprivileged 
          ? 'Apply principle of least privilege - remove unnecessary permissions'
          : undefined
      });
    }

    // Check for dangerous permissions
    const dangerousPerms = ['admin', 'root', 'sudo', 'delete_all', 'drop'];
    if (step.config?.permissions?.some((p: string) => 
      dangerousPerms.some(dp => p.toLowerCase().includes(dp))
    )) {
      audits.push({
        stepId: step.id,
        resource: step.config.resource || 'unknown',
        permissions: step.config.permissions,
        risk: 'high',
        overprivileged: true,
        recommendation: 'Avoid using administrative permissions unless absolutely necessary'
      });
    }

    return audits;
  }

  /**
   * Get required permissions based on step type and actions
   */
  private getRequiredPermissions(step: WorkflowStep): string[] {
    const basePerms: Record<string, string[]> = {
      'read': ['read', 'list'],
      'write': ['write', 'create', 'update'],
      'delete': ['delete'],
      'api': ['execute'],
      'script': ['execute'],
      'database': ['read', 'write']
    };

    return basePerms[step.type] || [];
  }

  /**
   * Scan for secrets in workflow configuration
   */
  private async scanForSecrets(step: WorkflowStep): Promise<SecretAudit[]> {
    const secrets: SecretAudit[] = [];
    const stepData = JSON.stringify(step.config);

    // Check for hardcoded secrets
    for (const [type, pattern] of Object.entries(SENSITIVE_PATTERNS)) {
      const matches = stepData.match(pattern);
      if (matches) {
        secrets.push({
          stepId: step.id,
          type: 'hardcoded',
          location: `step.config`,
          risk: 'critical',
          recommendation: `Remove hardcoded ${type} and use secure secret management`
        });
      }
    }

    // Check for exposed environment variables
    if (step.config?.env) {
      const sensitiveEnvVars = ['API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'PRIVATE_KEY'];
      Object.keys(step.config.env).forEach(key => {
        if (sensitiveEnvVars.some(sev => key.toUpperCase().includes(sev))) {
          secrets.push({
            stepId: step.id,
            type: 'exposed',
            location: `env.${key}`,
            risk: 'high',
            recommendation: 'Use secret management service instead of plain environment variables'
          });
        }
      });
    }

    // Check for weak secrets
    if (step.config?.auth?.password) {
      if (this.isWeakPassword(step.config.auth.password)) {
        secrets.push({
          stepId: step.id,
          type: 'weak',
          location: 'auth.password',
          risk: 'high',
          recommendation: 'Use strong passwords with at least 12 characters, mixed case, numbers, and symbols'
        });
      }
    }

    return secrets;
  }

  /**
   * Check if password is weak
   */
  private isWeakPassword(password: string): boolean {
    const weakPatterns = [
      /^(password|admin|123456|qwerty)/i,
      /^[a-z]+$/,  // only lowercase
      /^[0-9]+$/,  // only numbers
      /^.{0,7}$/   // too short
    ];

    return weakPatterns.some(pattern => pattern.test(password));
  }

  /**
   * Check workflow-level best practices
   */
  private checkBestPractices(workflow: WorkflowDefinition): BestPracticeViolation[] {
    const violations: BestPracticeViolation[] = [];

    // Check for error handling
    const stepsWithoutErrorHandling = workflow.steps.filter(
      step => !step.config?.errorHandling && !step.config?.onError
    );
    if (stepsWithoutErrorHandling.length > 0) {
      violations.push({
        practice: 'Error Handling',
        description: 'Steps without proper error handling detected',
        impact: 'medium',
        stepIds: stepsWithoutErrorHandling.map(s => s.id),
        recommendation: 'Implement error handling for all steps to ensure graceful failure'
      });
    }

    // Check for logging
    const stepsWithoutLogging = workflow.steps.filter(
      step => !step.config?.logging
    );
    if (stepsWithoutLogging.length > 0) {
      violations.push({
        practice: 'Audit Logging',
        description: 'Steps without audit logging detected',
        impact: 'low',
        stepIds: stepsWithoutLogging.map(s => s.id),
        recommendation: 'Enable logging for security-relevant operations'
      });
    }

    // Check for input validation
    const stepsWithInput = workflow.steps.filter(
      step => step.config?.input && !step.config?.validation
    );
    if (stepsWithInput.length > 0) {
      violations.push({
        practice: 'Input Validation',
        description: 'Steps accepting input without validation',
        impact: 'high',
        stepIds: stepsWithInput.map(s => s.id),
        recommendation: 'Validate all inputs to prevent injection attacks'
      });
    }

    // Check for timeout configuration
    const stepsWithoutTimeout = workflow.steps.filter(
      step => (step.type === 'api' || step.type === 'script') && !step.config?.timeout
    );
    if (stepsWithoutTimeout.length > 0) {
      violations.push({
        practice: 'Timeout Configuration',
        description: 'Long-running operations without timeout',
        impact: 'medium',
        stepIds: stepsWithoutTimeout.map(s => s.id),
        recommendation: 'Set appropriate timeouts to prevent resource exhaustion'
      });
    }

    return violations;
  }

  /**
   * Calculate overall risk score
   */
  private calculateRiskScore(
    vulnerabilities: Vulnerability[],
    permissions: PermissionAudit[],
    secrets: SecretAudit[],
    bestPractices: BestPracticeViolation[]
  ): { risk: SecurityScanResult['overallRisk']; score: number } {
    let score = 100;

    // Deduct points for vulnerabilities
    vulnerabilities.forEach(vuln => {
      switch (vuln.severity) {
        case 'critical': score -= 20; break;
        case 'high': score -= 10; break;
        case 'medium': score -= 5; break;
        case 'low': score -= 2; break;
      }
    });

    // Deduct points for permission issues
    permissions.forEach(perm => {
      if (perm.overprivileged) {
        switch (perm.risk) {
          case 'high': score -= 10; break;
          case 'medium': score -= 5; break;
          case 'low': score -= 2; break;
        }
      }
    });

    // Deduct points for secrets
    score -= secrets.length * 15;

    // Deduct points for best practice violations
    bestPractices.forEach(violation => {
      switch (violation.impact) {
        case 'high': score -= 5; break;
        case 'medium': score -= 3; break;
        case 'low': score -= 1; break;
      }
    });

    score = Math.max(0, score);

    // Determine risk level
    let risk: SecurityScanResult['overallRisk'];
    if (score >= 90) risk = 'low';
    else if (score >= 70) risk = 'medium';
    else if (score >= 50) risk = 'high';
    else risk = 'critical';

    // Override based on critical vulnerabilities
    const hasCritical = vulnerabilities.some(v => v.severity === 'critical') ||
                       secrets.length > 0;
    if (hasCritical && risk !== 'critical') {
      risk = 'high';
    }

    return { risk, score };
  }

  /**
   * Generate security report
   */
  generateReport(scanResult: SecurityScanResult): string {
    const report = [
      `# Workflow Security Scan Report`,
      ``,
      `**Workflow ID:** ${scanResult.workflowId}`,
      `**Scan ID:** ${scanResult.scanId}`,
      `**Timestamp:** ${scanResult.timestamp.toISOString()}`,
      `**Overall Risk:** ${scanResult.overallRisk.toUpperCase()}`,
      `**Security Score:** ${scanResult.score}/100`,
      ``,
      `## Summary`,
      `- Vulnerabilities Found: ${scanResult.vulnerabilities.length}`,
      `- Permission Issues: ${scanResult.permissions.filter(p => p.overprivileged).length}`,
      `- Exposed Secrets: ${scanResult.secrets.length}`,
      `- Best Practice Violations: ${scanResult.bestPractices.length}`,
      ``
    ];

    if (scanResult.vulnerabilities.length > 0) {
      report.push(`## Vulnerabilities`);
      scanResult.vulnerabilities.forEach(vuln => {
        report.push(`### ${vuln.severity.toUpperCase()}: ${vuln.description}`);
        report.push(`- **Step:** ${vuln.stepId}`);
        report.push(`- **Type:** ${vuln.type}`);
        if (vuln.cwe) report.push(`- **CWE:** ${vuln.cwe}`);
        if (vuln.cvss) report.push(`- **CVSS Score:** ${vuln.cvss}`);
        report.push(`- **Recommendation:** ${vuln.recommendation}`);
        report.push(``);
      });
    }

    if (scanResult.secrets.length > 0) {
      report.push(`## Exposed Secrets`);
      scanResult.secrets.forEach(secret => {
        report.push(`### ${secret.risk.toUpperCase()}: ${secret.type} secret found`);
        report.push(`- **Step:** ${secret.stepId}`);
        report.push(`- **Location:** ${secret.location}`);
        report.push(`- **Recommendation:** ${secret.recommendation}`);
        report.push(``);
      });
    }

    if (scanResult.permissions.filter(p => p.overprivileged).length > 0) {
      report.push(`## Permission Audit`);
      scanResult.permissions
        .filter(p => p.overprivileged)
        .forEach(perm => {
          report.push(`### Overprivileged Access - ${perm.resource}`);
          report.push(`- **Step:** ${perm.stepId}`);
          report.push(`- **Permissions:** ${perm.permissions.join(', ')}`);
          report.push(`- **Risk:** ${perm.risk}`);
          if (perm.recommendation) {
            report.push(`- **Recommendation:** ${perm.recommendation}`);
          }
          report.push(``);
        });
    }

    if (scanResult.bestPractices.length > 0) {
      report.push(`## Best Practice Violations`);
      scanResult.bestPractices.forEach(violation => {
        report.push(`### ${violation.practice}`);
        report.push(`- **Description:** ${violation.description}`);
        report.push(`- **Impact:** ${violation.impact}`);
        report.push(`- **Affected Steps:** ${violation.stepIds.join(', ')}`);
        report.push(`- **Recommendation:** ${violation.recommendation}`);
        report.push(``);
      });
    }

    return report.join('\n');
  }
}

// Type definitions
interface WorkflowDefinition {
  id: string;
  name: string;
  steps: WorkflowStep[];
}

interface WorkflowStep {
  id: string;
  name: string;
  type: string;
  config?: any;
}

// Export convenience function
export async function scanWorkflowSecurity(workflow: WorkflowDefinition): Promise<SecurityScanResult> {
  const scanner = new WorkflowSecurityScanner();
  return scanner.scanWorkflow(workflow);
}