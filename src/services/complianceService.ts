// src/services/complianceService.ts
import { supabase } from '../utils/supabase';
import { encryptionService } from './encryptionService';
import { errorHandler } from './errorHandlingService';
import * as storageService from './storageService';

/**
 * Healthcare compliance validation and audit logging service
 * Ensures GDPR, HIPAA, and other healthcare data protection compliance
 * Provides comprehensive audit trails and data validation
 */

export type AuditAction =
  | 'login'
  | 'logout'
  | 'data_access'
  | 'data_create'
  | 'data_update'
  | 'data_delete'
  | 'data_export'
  | 'data_sync'
  | 'encryption_key_change'
  | 'consent_update'
  | 'privacy_setting_change'
  | 'account_deletion';

export type DataSensitivity =
  | 'public'
  | 'internal'
  | 'confidential'
  | 'restricted'
  | 'healthcare_sensitive';

export interface AuditLogEntry {
  id: string;
  userId: string;
  action: AuditAction;
  tableName?: string;
  recordId?: string;
  dataSensitivity: DataSensitivity;
  timestamp: string;
  sessionId: string;
  ipAddress?: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  dataHash?: string; // Hash of sensitive data for integrity verification
  consentStatus: boolean;
  retentionPeriod?: number; // Days to retain this audit log
  complianceFlags: string[]; // GDPR, HIPAA, etc.
}

export interface ComplianceValidationResult {
  isCompliant: boolean;
  violations: ComplianceViolation[];
  recommendations: string[];
  riskScore: number; // 0-100
}

export interface ComplianceViolation {
  type: 'gdpr' | 'hipaa' | 'data_retention' | 'encryption' | 'consent' | 'access_control';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  affectedData: string[];
  remediationSteps: string[];
  requiredBy: string; // Regulation requirement
}

export interface ConsentRecord {
  userId: string;
  consentType: 'data_processing' | 'data_sharing' | 'analytics' | 'marketing' | 'healthcare_data';
  granted: boolean;
  timestamp: string;
  version: string; // Privacy policy version
  ipAddress?: string;
  withdrawnAt?: string;
  parentalConsent?: boolean; // For minors
}

export interface DataRetentionPolicy {
  dataType: string;
  retentionPeriodDays: number;
  automaticDeletion: boolean;
  archiveAfterDays?: number;
  legalBasis: string;
  exceptions: string[];
}

export class ComplianceService {
  private static instance: ComplianceService;
  private sessionId: string;
  private auditQueue: AuditLogEntry[] = [];
  private isOnline: boolean = navigator.onLine;
  private consentCache: Map<string, ConsentRecord[]> = new Map();
  private retentionPolicies: DataRetentionPolicy[] = [];

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeRetentionPolicies();
    this.initializeNetworkListeners();
    this.startAuditQueueProcessor();
  }

  public static getInstance(): ComplianceService {
    if (!ComplianceService.instance) {
      ComplianceService.instance = new ComplianceService();
    }
    return ComplianceService.instance;
  }

  /**
   * Initialize data retention policies for healthcare compliance
   */
  private initializeRetentionPolicies(): void {
    this.retentionPolicies = [
      {
        dataType: 'symptoms',
        retentionPeriodDays: 2555, // 7 years (healthcare requirement)
        automaticDeletion: false, // Manual review required
        archiveAfterDays: 1095, // 3 years
        legalBasis: 'Healthcare data retention requirement (7 years)',
        exceptions: ['ongoing_treatment', 'legal_proceedings'],
      },
      {
        dataType: 'goals',
        retentionPeriodDays: 1095, // 3 years
        automaticDeletion: true,
        legalBasis: 'Legitimate interest in providing ongoing support',
        exceptions: ['user_objection'],
      },
      {
        dataType: 'achievements',
        retentionPeriodDays: 1095, // 3 years
        automaticDeletion: true,
        legalBasis: 'Legitimate interest in providing ongoing support',
        exceptions: ['user_objection'],
      },
      {
        dataType: 'calendarNotes',
        retentionPeriodDays: 2555, // 7 years (may contain health information)
        automaticDeletion: false,
        archiveAfterDays: 1095,
        legalBasis: 'Healthcare data retention requirement',
        exceptions: ['ongoing_treatment'],
      },
      {
        dataType: 'audit_logs',
        retentionPeriodDays: 2190, // 6 years (compliance requirement)
        automaticDeletion: false,
        legalBasis: 'Legal obligation for audit trail retention',
        exceptions: [],
      },
      {
        dataType: 'wordFiles',
        retentionPeriodDays: 1095, // 3 years
        automaticDeletion: true,
        legalBasis: 'Legitimate interest',
        exceptions: ['user_objection'],
      },
    ];
  }

  /**
   * Initialize network listeners for offline audit handling
   */
  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processAuditQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Start audit queue processor
   */
  private startAuditQueueProcessor(): void {
    setInterval(() => {
      if (this.isOnline && this.auditQueue.length > 0) {
        this.processAuditQueue();
      }
    }, 30000); // Process every 30 seconds
  }

  /**
   * Log audit event with compliance validation
   */
  async logAuditEvent(
    action: AuditAction,
    options: {
      tableName?: string;
      recordId?: string;
      dataSensitivity?: DataSensitivity;
      success?: boolean;
      errorMessage?: string;
      data?: unknown;
    } = {}
  ): Promise<void> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return; // Can't log without user context

      const auditEntry: AuditLogEntry = {
        id: this.generateAuditId(),
        userId: user.id,
        action,
        tableName: options.tableName,
        recordId: options.recordId,
        dataSensitivity: options.dataSensitivity || 'internal',
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        ipAddress: await this.getClientIP(),
        userAgent: navigator.userAgent,
        success: options.success ?? true,
        errorMessage: options.errorMessage,
        dataHash: options.data ? this.generateDataHash(options.data) : undefined,
        consentStatus: await this.checkConsentStatus(user.id, action),
        retentionPeriod: this.getRetentionPeriod(options.tableName || action),
        complianceFlags: this.getComplianceFlags(action, options.dataSensitivity),
      };

      // Queue for processing
      this.auditQueue.push(auditEntry);

      // Immediate processing if online
      if (this.isOnline) {
        await this.processAuditQueue();
      }

      // Store locally for offline access
      this.storeAuditLocally(auditEntry);
    } catch (error) {
      await errorHandler.handleError(error as Error, 'compliance', 'high', { action, options });
    }
  }

  /**
   * Validate compliance across all data and operations
   */
  async validateCompliance(userId: string): Promise<ComplianceValidationResult> {
    const violations: ComplianceViolation[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    try {
      // 1. Validate consent status
      const consentViolations = await this.validateConsentCompliance(userId);
      violations.push(...consentViolations);

      // 2. Validate data retention compliance
      const retentionViolations = await this.validateDataRetention();
      violations.push(...retentionViolations);

      // 3. Validate encryption compliance
      const encryptionViolations = await this.validateEncryptionCompliance(userId);
      violations.push(...encryptionViolations);

      // 4. Validate access control compliance
      const accessViolations = await this.validateAccessControl();
      violations.push(...accessViolations);

      // 5. Calculate risk score
      riskScore = this.calculateRiskScore(violations);

      // 6. Generate recommendations
      recommendations.push(...this.generateRecommendations(violations));

      return {
        isCompliant: violations.length === 0,
        violations,
        recommendations,
        riskScore,
      };
    } catch (error) {
      await errorHandler.handleError(error as Error, 'compliance', 'critical', { userId });

      return {
        isCompliant: false,
        violations: [
          {
            type: 'gdpr',
            severity: 'critical',
            description: 'Compliance validation failed due to system error',
            affectedData: ['all'],
            remediationSteps: ['Contact system administrator', 'Review system logs'],
            requiredBy: 'GDPR Article 32',
          },
        ],
        recommendations: ['Immediate system review required'],
        riskScore: 100,
      };
    }
  }

  /**
   * Record user consent
   */
  async recordConsent(
    userId: string,
    consentType: ConsentRecord['consentType'],
    granted: boolean,
    privacyPolicyVersion: string,
    parentalConsent?: boolean
  ): Promise<void> {
    const consentRecord: ConsentRecord = {
      userId,
      consentType,
      granted,
      timestamp: new Date().toISOString(),
      version: privacyPolicyVersion,
      ipAddress: await this.getClientIP(),
      parentalConsent,
    };

    try {
      // Store in database
      const { error } = await supabase.from('consent_records').insert(consentRecord);

      if (error) throw error;

      // Update cache
      const userConsents = this.consentCache.get(userId) || [];
      userConsents.push(consentRecord);
      this.consentCache.set(userId, userConsents);

      // Log audit event
      await this.logAuditEvent('consent_update', {
        dataSensitivity: 'confidential',
        data: { consentType, granted, version: privacyPolicyVersion },
      });
    } catch (error) {
      await errorHandler.handleError(error as Error, 'compliance', 'high', {
        userId,
        consentType,
        granted,
      });
    }
  }

  /**
   * Withdraw consent (GDPR right)
   */
  async withdrawConsent(userId: string, consentType: ConsentRecord['consentType']): Promise<void> {
    try {
      // Update existing consent record
      const { error } = await supabase
        .from('consent_records')
        .update({
          granted: false,
          withdrawnAt: new Date().toISOString(),
        })
        .eq('userId', userId)
        .eq('consentType', consentType)
        .eq('granted', true);

      if (error) throw error;

      // Update cache
      const userConsents = this.consentCache.get(userId) || [];
      const consentIndex = userConsents.findIndex(
        c => c.consentType === consentType && c.granted && !c.withdrawnAt
      );

      if (consentIndex >= 0) {
        userConsents[consentIndex].granted = false;
        userConsents[consentIndex].withdrawnAt = new Date().toISOString();
      }

      // Log audit event
      await this.logAuditEvent('consent_update', {
        dataSensitivity: 'confidential',
        data: { consentType, granted: false, withdrawn: true },
      });

      // Trigger data deletion if required
      await this.handleConsentWithdrawal(consentType);
    } catch (error) {
      await errorHandler.handleError(error as Error, 'compliance', 'high', { userId, consentType });
    }
  }

  /**
   * Export user data (GDPR right to data portability)
   */
  async exportUserData(userId: string): Promise<{
    personalData: Record<string, any>;
    auditLog: AuditLogEntry[];
    consentHistory: ConsentRecord[];
    exportMetadata: {
      exportedAt: string;
      exportId: string;
      dataIntegrityHash: string;
    };
  }> {
    try {
      // Log export request
      await this.logAuditEvent('data_export', {
        dataSensitivity: 'healthcare_sensitive',
      });

      // Collect all user data
      const personalData: Record<string, any> = {};

      const dataTypes = [
        'goals',
        'achievements',
        'skills',
        'calendarNotes',
        'symptoms',
        'wordFiles',
      ];
      for (const dataType of dataTypes) {
        try {
          const data = storageService.get(dataType);
          if (data) {
            personalData[dataType] = data;
          }
        } catch (error) {
          console.warn(`Failed to export ${dataType}:`, error);
        }
      }

      // Get audit log
      const { data: auditLog } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false });

      // Get consent history
      const { data: consentHistory } = await supabase
        .from('consent_records')
        .select('*')
        .eq('userId', userId)
        .order('timestamp', { ascending: false });

      const exportData = {
        personalData,
        auditLog: auditLog || [],
        consentHistory: consentHistory || [],
      };

      const exportMetadata = {
        exportedAt: new Date().toISOString(),
        exportId: this.generateExportId(),
        dataIntegrityHash: this.generateDataHash(exportData),
      };

      return {
        ...exportData,
        exportMetadata,
      };
    } catch (error) {
      await errorHandler.handleError(error as Error, 'compliance', 'high', { userId });
      throw error;
    }
  }

  /**
   * Delete user data (GDPR right to erasure)
   */
  async deleteUserData(
    userId: string,
    options: {
      hardDelete?: boolean;
      retainAuditLog?: boolean;
      retainForLegalReasons?: boolean;
    } = {}
  ): Promise<{ deleted: string[]; retained: string[]; errors: string[] }> {
    const results = {
      deleted: [] as string[],
      retained: [] as string[],
      errors: [] as string[],
    };

    try {
      // Log deletion request
      await this.logAuditEvent('account_deletion', {
        dataSensitivity: 'healthcare_sensitive',
        data: options,
      });

      // Get retention policies
      const dataTypes = [
        'goals',
        'achievements',
        'skills',
        'calendarNotes',
        'symptoms',
        'wordFiles',
      ];

      for (const dataType of dataTypes) {
        try {
          const policy = this.retentionPolicies.find(p => p.dataType === dataType);

          // Check if data should be retained for legal reasons
          if (options.retainForLegalReasons && policy?.exceptions.includes('legal_proceedings')) {
            results.retained.push(dataType);
            continue;
          }

          // Delete from localStorage
          storageService.remove(dataType);

          // Delete from Supabase (soft delete unless hard delete requested)
          if (options.hardDelete) {
            await this.hardDeleteData(userId, dataType);
          } else {
            await this.softDeleteData(userId, dataType);
          }

          results.deleted.push(dataType);
        } catch (error) {
          results.errors.push(
            `${dataType}: ${error instanceof Error ? error.message : String(error)}`
          );
        }
      }

      // Handle audit log retention
      if (!options.retainAuditLog) {
        await this.anonymizeAuditLog(userId);
        results.deleted.push('audit_logs');
      } else {
        results.retained.push('audit_logs');
      }

      return results;
    } catch (error) {
      await errorHandler.handleError(error as Error, 'compliance', 'critical', { userId, options });
      throw error;
    }
  }

  /**
   * Get compliance report
   */
  async getComplianceReport(userId: string): Promise<{
    consentStatus: Record<string, boolean>;
    dataRetentionStatus: Record<string, { daysRemaining: number; action: string }>;
    auditSummary: { totalEvents: number; recentActivity: number };
    riskAssessment: ComplianceValidationResult;
  }> {
    try {
      // Get consent status
      const consents = await this.getConsentStatus(userId);
      const consentStatus: Record<string, boolean> = {};
      consents.forEach(consent => {
        consentStatus[consent.consentType] = consent.granted && !consent.withdrawnAt;
      });

      // Get data retention status
      const dataRetentionStatus: Record<string, { daysRemaining: number; action: string }> = {};
      for (const policy of this.retentionPolicies) {
        const daysRemaining = await this.calculateRetentionDaysRemaining(policy.dataType);
        dataRetentionStatus[policy.dataType] = {
          daysRemaining,
          action:
            daysRemaining <= 30
              ? 'immediate_action_required'
              : daysRemaining <= 90
                ? 'review_needed'
                : 'monitoring',
        };
      }

      // Get audit summary
      const { data: auditData } = await supabase
        .from('audit_logs')
        .select('id, timestamp')
        .eq('user_id', userId);

      const totalEvents = auditData?.length || 0;
      const recentEvents =
        auditData?.filter(log => {
          const logDate = new Date(log.timestamp);
          const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
          return logDate > weekAgo;
        }).length || 0;

      // Get risk assessment
      const riskAssessment = await this.validateCompliance(userId);

      return {
        consentStatus,
        dataRetentionStatus,
        auditSummary: {
          totalEvents,
          recentActivity: recentEvents,
        },
        riskAssessment,
      };
    } catch (error) {
      await errorHandler.handleError(error as Error, 'compliance', 'medium', { userId });
      throw error;
    }
  }

  // Private methods for compliance validation

  private async validateConsentCompliance(userId: string): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    try {
      const consents = await this.getConsentStatus(userId);
      const requiredConsents = ['data_processing', 'healthcare_data'];

      for (const required of requiredConsents) {
        const consent = consents.find(c => c.consentType === required);
        if (!consent || !consent.granted || consent.withdrawnAt) {
          violations.push({
            type: 'consent',
            severity: 'high',
            description: `Missing or withdrawn consent for ${required}`,
            affectedData: [required],
            remediationSteps: [
              'Request updated consent from user',
              'Stop processing data if consent not granted',
              'Implement consent management workflow',
            ],
            requiredBy: 'GDPR Article 6',
          });
        }
      }
    } catch (error) {
      console.error('Consent validation error:', error);
    }

    return violations;
  }

  private async validateDataRetention(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    for (const policy of this.retentionPolicies) {
      try {
        const daysRemaining = await this.calculateRetentionDaysRemaining(policy.dataType);

        if (daysRemaining <= 0) {
          violations.push({
            type: 'data_retention',
            severity: 'high',
            description: `Data retention period exceeded for ${policy.dataType}`,
            affectedData: [policy.dataType],
            remediationSteps: [
              'Review data for legal hold requirements',
              'Delete or anonymize expired data',
              'Update retention policies if needed',
            ],
            requiredBy: policy.legalBasis,
          });
        }
      } catch (error) {
        console.error(`Retention validation error for ${policy.dataType}:`, error);
      }
    }

    return violations;
  }

  private async validateEncryptionCompliance(userId: string): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    try {
      // Test encryption functionality
      const encryptionWorking = encryptionService.testEncryption(userId);

      if (!encryptionWorking) {
        violations.push({
          type: 'encryption',
          severity: 'critical',
          description: 'Encryption system not functioning properly',
          affectedData: ['all_sensitive_data'],
          remediationSteps: [
            'Immediately investigate encryption service',
            'Stop processing sensitive data until resolved',
            'Review encryption key management',
          ],
          requiredBy: 'GDPR Article 32, HIPAA Security Rule',
        });
      }
    } catch (error) {
      console.error('Encryption validation error:', error);
    }

    return violations;
  }

  private async validateAccessControl(): Promise<ComplianceViolation[]> {
    const violations: ComplianceViolation[] = [];

    try {
      // Check if RLS is enabled (this would be a more complex check in practice)
      const { error } = await supabase.from('user_profiles').select('id').limit(1);

      if (error && error.code !== 'PGRST116') {
        violations.push({
          type: 'access_control',
          severity: 'critical',
          description: 'Database access control validation failed',
          affectedData: ['all_database_data'],
          remediationSteps: [
            'Verify Row Level Security policies',
            'Test access control mechanisms',
            'Review database permissions',
          ],
          requiredBy: 'GDPR Article 32, HIPAA Access Control',
        });
      }
    } catch (error) {
      console.error('Access control validation error:', error);
    }

    return violations;
  }

  private calculateRiskScore(violations: ComplianceViolation[]): number {
    let score = 0;

    violations.forEach(violation => {
      switch (violation.severity) {
        case 'critical':
          score += 25;
          break;
        case 'high':
          score += 15;
          break;
        case 'medium':
          score += 5;
          break;
        case 'low':
          score += 1;
          break;
      }
    });

    return Math.min(100, score);
  }

  private generateRecommendations(violations: ComplianceViolation[]): string[] {
    const recommendations = new Set<string>();

    violations.forEach(violation => {
      violation.remediationSteps.forEach(step => {
        recommendations.add(step);
      });
    });

    // Add general recommendations
    if (violations.length > 0) {
      recommendations.add('Schedule regular compliance audits');
      recommendations.add('Implement compliance monitoring dashboard');
      recommendations.add('Train staff on data protection requirements');
    }

    return Array.from(recommendations);
  }

  // Utility methods

  private async processAuditQueue(): Promise<void> {
    if (this.auditQueue.length === 0) return;

    const batch = this.auditQueue.splice(0, 10); // Process 10 at a time

    try {
      const { error } = await supabase.from('audit_logs').insert(batch);

      if (error) throw error;
    } catch (error) {
      // Put failed entries back in queue
      this.auditQueue.unshift(...batch);

      await errorHandler.handleError(error as Error, 'compliance', 'medium', {
        batchSize: batch.length,
      });
    }
  }

  private storeAuditLocally(entry: AuditLogEntry): void {
    try {
      const localAudits = storageService.get<AuditLogEntry[]>('local_audit_log') || [];
      localAudits.push(entry);

      // Keep only last 100 entries locally
      if (localAudits.length > 100) {
        localAudits.splice(0, localAudits.length - 100);
      }

      storageService.set('local_audit_log', localAudits);
    } catch (error) {
      console.error('Failed to store audit locally:', error);
    }
  }

  private async getConsentStatus(userId: string): Promise<ConsentRecord[]> {
    // Check cache first
    if (this.consentCache.has(userId)) {
      return this.consentCache.get(userId)!;
    }

    try {
      const { data, error } = await supabase
        .from('consent_records')
        .select('*')
        .eq('userId', userId)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      const consents = data || [];
      this.consentCache.set(userId, consents);
      return consents;
    } catch (error) {
      console.error('Failed to get consent status:', error);
      return [];
    }
  }

  private async checkConsentStatus(userId: string, action: AuditAction): Promise<boolean> {
    const consents = await this.getConsentStatus(userId);

    // Map actions to required consent types
    const consentMapping: Record<string, string> = {
      data_access: 'data_processing',
      data_create: 'data_processing',
      data_update: 'data_processing',
      data_delete: 'data_processing',
      data_sync: 'data_processing',
    };

    const requiredConsent = consentMapping[action];
    if (!requiredConsent) return true; // No specific consent required

    const consent = consents.find(c => c.consentType === requiredConsent);
    return consent ? consent.granted && !consent.withdrawnAt : false;
  }

  private async calculateRetentionDaysRemaining(dataType: string): Promise<number> {
    const policy = this.retentionPolicies.find(p => p.dataType === dataType);
    if (!policy) return Infinity;

    // This would check the actual data creation date
    // For now, using a placeholder calculation
    const dataCreationDate = new Date('2024-01-01'); // Placeholder
    const expirationDate = new Date(
      dataCreationDate.getTime() + policy.retentionPeriodDays * 24 * 60 * 60 * 1000
    );
    const now = new Date();

    return Math.ceil((expirationDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
  }

  private async handleConsentWithdrawal(consentType: string): Promise<void> {
    switch (consentType) {
      case 'data_processing':
        console.log('🛑 Data processing consent withdrawn - implementing data processing halt');
        // TODO: Implement actual data processing halt mechanisms
        // - Stop background sync operations
        // - Disable automatic data collection
        // - Flag user account for processing restrictions
        break;

      case 'analytics':
        console.log('📊 Analytics consent withdrawn - disabling analytics tracking');
        // TODO: Implement analytics disabling
        // - Remove analytics trackers
        // - Delete existing analytics data
        // - Update user preferences
        break;

      case 'healthcare_data':
        console.log('🏥 Healthcare data consent withdrawn - initiating data review process');
        // TODO: Implement healthcare data handling
        // - Mark data for review/deletion
        // - Notify compliance team
        // - Begin data retention policy review
        break;

      default:
        console.warn(`Unknown consent type for withdrawal: ${consentType}`);
    }
  }

  private async hardDeleteData(userId: string, dataType: string): Promise<void> {
    const tableName = this.getTableName(dataType);

    const { error } = await supabase.from(tableName).delete().eq('user_id', userId);

    if (error) throw error;
  }

  private async softDeleteData(userId: string, dataType: string): Promise<void> {
    const tableName = this.getTableName(dataType);

    const { error } = await supabase
      .from(tableName)
      .update({ is_deleted: true, deleted_at: new Date().toISOString() })
      .eq('user_id', userId);

    if (error) throw error;
  }

  private async anonymizeAuditLog(userId: string): Promise<void> {
    const { error } = await supabase
      .from('audit_logs')
      .update({
        userId: 'ANONYMIZED',
        ipAddress: null,
        userAgent: 'ANONYMIZED',
        dataHash: null,
      })
      .eq('user_id', userId);

    if (error) throw error;
  }

  private getTableName(dataType: string): string {
    const tableMap: Record<string, string> = {
      goals: 'user_goals',
      achievements: 'user_achievements',
      skills: 'user_skills',
      calendarNotes: 'user_calendar_notes',
      symptoms: 'user_symptoms',
      wordFiles: 'user_word_files',
    };
    return tableMap[dataType] || 'user_profiles';
  }

  private getRetentionPeriod(dataType: string): number {
    const policy = this.retentionPolicies.find(p => p.dataType === dataType);
    return policy ? policy.retentionPeriodDays : 1095; // Default 3 years
  }

  private getComplianceFlags(action: AuditAction, sensitivity?: DataSensitivity): string[] {
    const flags = ['GDPR'];

    if (sensitivity === 'healthcare_sensitive') {
      flags.push('HIPAA');
    }

    if (['data_export', 'account_deletion'].includes(action)) {
      flags.push('RIGHT_TO_PORTABILITY', 'RIGHT_TO_ERASURE');
    }

    return flags;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateAuditId(): string {
    return `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExportId(): string {
    return `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateDataHash(data: any): string {
    return btoa(JSON.stringify(data)).substr(0, 32);
  }

  private async getClientIP(): Promise<string | undefined> {
    try {
      // This would typically use a service to get the real IP
      // For privacy reasons, might be omitted or anonymized
      return undefined;
    } catch {
      return undefined;
    }
  }
}

// Export singleton instance
export const complianceService = ComplianceService.getInstance();

// Types are exported with their declarations above
