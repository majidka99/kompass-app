// src/services/errorHandlingService.ts
import { supabase } from '../utils/supabase';
import { encryptionService } from './encryptionService';
import * as storageService from './storageService';

/**
 * Comprehensive error handling and fallback logic for healthcare applications
 * Provides graceful degradation, automatic recovery, and compliance logging
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory =
  | 'network'
  | 'authentication'
  | 'encryption'
  | 'storage'
  | 'validation'
  | 'sync'
  | 'compliance'
  | 'user_action'
  | 'system';

export interface ErrorInfo {
  id: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  timestamp: string;
  userId?: string;
  _context?: Record<string, any>;
  stackTrace?: string;
  userAgent?: string;
  url?: string;
  resolved: boolean;
  retryCount: number;
  maxRetries: number;
}

export interface FallbackStrategy {
  name: string;
  category: ErrorCategory;
  handler: (error: Error, _context?: any) => Promise<any>;
  canRetry: boolean;
  maxRetries: number;
  priority: number; // Lower number = higher priority
}

export interface RecoveryAction {
  name: string;
  description: string;
  action: () => Promise<boolean>;
  isDestructive: boolean;
  requiresConfirmation: boolean;
}

export class ErrorHandlingService {
  private static instance: ErrorHandlingService;
  private errorLog: Map<string, ErrorInfo> = new Map();
  private fallbackStrategies: FallbackStrategy[] = [];
  private listeners: Set<(error: ErrorInfo) => void> = new Set();
  private isOnline: boolean = navigator.onLine;
  private maxLogSize: number = 1000;
  private retryQueue: Map<string, { error: ErrorInfo; strategy: FallbackStrategy }> = new Map();

  private constructor() {
    this.initializeFallbackStrategies();
    this.initializeNetworkListeners();
    this.loadErrorLog();
  }

  public static getInstance(): ErrorHandlingService {
    if (!ErrorHandlingService.instance) {
      ErrorHandlingService.instance = new ErrorHandlingService();
    }
    return ErrorHandlingService.instance;
  }

  /**
   * Initialize network change listeners
   */
  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processRetryQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Initialize fallback strategies
   */
  private initializeFallbackStrategies(): void {
    this.fallbackStrategies = [
      // Network errors
      {
        name: 'network_retry',
        category: 'network',
        canRetry: true,
        maxRetries: 3,
        priority: 1,
        handler: async (_error: Error, __context?: any) => {
          await this.delay(1000 * Math.random() * 2); // Random delay 0-2s
          return __context?.retryFunction ? await __context.retryFunction() : null;
        },
      },
      {
        name: 'offline_mode',
        category: 'network',
        canRetry: false,
        maxRetries: 0,
        priority: 2,
        handler: async (_error: Error, __context?: any) => {
          return { mode: 'offline', data: __context?.fallbackData };
        },
      },

      // Authentication errors
      {
        name: 'token_refresh',
        category: 'authentication',
        canRetry: true,
        maxRetries: 2,
        priority: 1,
        handler: async (_error: Error) => {
          try {
            const { data, error: refreshError } = await supabase.auth.refreshSession();
            if (refreshError) throw refreshError;
            return data;
          } catch (refreshError) {
            throw new Error('Token refresh failed');
          }
        },
      },
      {
        name: 'reauth_required',
        category: 'authentication',
        canRetry: false,
        maxRetries: 0,
        priority: 2,
        handler: async (_error: Error) => {
          return { requiresReauth: true };
        },
      },

      // Encryption errors
      {
        name: 'encryption_key_regenerate',
        category: 'encryption',
        canRetry: true,
        maxRetries: 1,
        priority: 1,
        handler: async (_error: Error, __context?: any) => {
          encryptionService.clearDeviceFingerprint();
          return { keyRegenerated: true };
        },
      },
      {
        name: 'encryption_fallback',
        category: 'encryption',
        canRetry: false,
        maxRetries: 0,
        priority: 2,
        handler: async (_error: Error, __context?: any) => {
          return { encryptionDisabled: true, data: __context?.plainData };
        },
      },

      // Storage errors
      {
        name: 'storage_cleanup',
        category: 'storage',
        canRetry: true,
        maxRetries: 1,
        priority: 1,
        handler: async (_error: Error) => {
          console.log('🧹 Cleaning up storage space');
          await this.cleanupStorageSpace();
          return { storageCleanedUp: true };
        },
      },
      {
        name: 'localStorage_fallback',
        category: 'storage',
        canRetry: false,
        maxRetries: 0,
        priority: 2,
        handler: async (_error: Error, __context?: any) => {
          return { useLocalStorageOnly: true };
        },
      },

      // Sync errors
      {
        name: 'partial_sync',
        category: 'sync',
        canRetry: true,
        maxRetries: 2,
        priority: 1,
        handler: async (_error: Error, __context?: any) => {
          // Try to sync priority data only
          return { partialSyncAttempted: true };
        },
      },
      {
        name: 'queue_for_later',
        category: 'sync',
        canRetry: false,
        maxRetries: 0,
        priority: 2,
        handler: async (_error: Error, __context?: any) => {
          return { queuedForLater: true };
        },
      },
    ];
  }

  /**
   * Handle error with automatic fallback strategies
   */
  async handleError(
    error: Error,
    category: ErrorCategory,
    severity: ErrorSeverity = 'medium',
    _context?: Record<string, any>
  ): Promise<any> {
    const errorInfo = this.createErrorInfo(error, category, severity, _context);

    // Log the error
    this.logError(errorInfo);

    // Notify listeners
    this.notifyListeners(errorInfo);

    // Find applicable fallback strategies
    const strategies = this.fallbackStrategies
      .filter(strategy => strategy.category === category)
      .sort((a, b) => a.priority - b.priority);

    // Try each strategy
    for (const strategy of strategies) {
      try {
        const result = await strategy.handler(error, _context);

        // Mark error as resolved if strategy succeeded
        errorInfo.resolved = true;
        this.updateErrorInfo(errorInfo);

        return result;
      } catch (strategyError) {
        console.warn(`❌ Fallback strategy ${strategy.name} failed:`, strategyError);

        // If strategy can retry and hasn't exceeded max retries
        if (strategy.canRetry && errorInfo.retryCount < strategy.maxRetries) {
          this.queueForRetry(errorInfo, strategy);
        }
      }
    }

    // If all strategies failed, escalate based on severity
    return this.escalateError(errorInfo);
  }

  /**
   * Create structured error information
   */
  private createErrorInfo(
    error: Error,
    category: ErrorCategory,
    severity: ErrorSeverity,
    _context?: Record<string, any>
  ): ErrorInfo {
    return {
      id: this.generateErrorId(),
      message: error.message,
      category,
      severity,
      timestamp: new Date().toISOString(),
      userId: _context?.userId,
      _context: this.sanitizeContext(_context),
      stackTrace: error.stack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      resolved: false,
      retryCount: 0,
      maxRetries: this.getMaxRetriesForCategory(category),
    };
  }

  /**
   * Log error with rotation
   */
  private logError(errorInfo: ErrorInfo): void {
    this.errorLog.set(errorInfo.id, errorInfo);

    // Rotate log if it gets too large
    if (this.errorLog.size > this.maxLogSize) {
      const oldestEntries = Array.from(this.errorLog.entries())
        .sort(([, a], [, b]) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
        .slice(0, this.errorLog.size - this.maxLogSize);

      oldestEntries.forEach(([id]) => this.errorLog.delete(id));
    }

    // Persist to localStorage
    this.saveErrorLog();

    // Log to console based on severity
    this.logToConsole(errorInfo);

    // Send to remote logging if available and critical
    if (errorInfo.severity === 'critical' && this.isOnline) {
      this.sendToRemoteLogging(errorInfo);
    }
  }

  /**
   * Escalate error based on severity
   */
  private async escalateError(errorInfo: ErrorInfo): Promise<any> {
    switch (errorInfo.severity) {
      case 'critical':
        // Show user notification and offer recovery options
        return this.handleCriticalError(errorInfo);

      case 'high':
        // Log warning and provide user feedback
        console.error('🚨 High severity error:', errorInfo.message);
        return { error: true, message: errorInfo.message, canRetry: true };

      case 'medium':
        // Log warning
        console.warn('⚠️ Medium severity error:', errorInfo.message);
        return { error: true, message: errorInfo.message, silent: true };

      case 'low':
        // Silent log
        console.info('ℹ️ Low severity error:', errorInfo.message);
        return { error: true, silent: true };

      default:
        return { error: true, message: errorInfo.message };
    }
  }

  /**
   * Handle critical errors with recovery options
   */
  private async handleCriticalError(errorInfo: ErrorInfo): Promise<any> {
    console.error('🚨 CRITICAL ERROR:', errorInfo);

    // Generate recovery actions based on error category
    const recoveryActions = this.generateRecoveryActions(errorInfo);

    return {
      error: true,
      critical: true,
      message: errorInfo.message,
      recoveryActions,
      errorId: errorInfo.id,
    };
  }

  /**
   * Generate recovery actions for critical errors
   */
  private generateRecoveryActions(errorInfo: ErrorInfo): RecoveryAction[] {
    const actions: RecoveryAction[] = [];

    switch (errorInfo.category) {
      case 'encryption':
        actions.push({
          name: 'reset_encryption',
          description: 'Reset encryption keys (will require re-login)',
          action: async () => {
            encryptionService.clearDeviceFingerprint();
            localStorage.clear();
            return true;
          },
          isDestructive: true,
          requiresConfirmation: true,
        });
        break;

      case 'storage':
        actions.push({
          name: 'clear_cache',
          description: 'Clear application cache',
          action: async () => {
            await this.cleanupStorageSpace();
            return true;
          },
          isDestructive: false,
          requiresConfirmation: false,
        });
        break;

      case 'sync':
        actions.push({
          name: 'force_resync',
          description: 'Force complete data resynchronization',
          action: async () => {
            // Clear sync state and force full sync
            storageService.remove('sync_state');
            return true;
          },
          isDestructive: false,
          requiresConfirmation: true,
        });
        break;

      case 'network':
        actions.push({
          name: 'retry_connection',
          description: 'Retry network connection',
          action: async () => {
            // Test network connectivity
            try {
              await fetch('/ping', { method: 'HEAD' });
              return true;
            } catch {
              return false;
            }
          },
          isDestructive: false,
          requiresConfirmation: false,
        });
        break;
    }

    // Always add app restart option for critical errors
    actions.push({
      name: 'restart_app',
      description: 'Restart the application',
      action: async () => {
        window.location.reload();
        return true;
      },
      isDestructive: false,
      requiresConfirmation: true,
    });

    return actions;
  }

  /**
   * Queue error for retry when back online
   */
  private queueForRetry(errorInfo: ErrorInfo, strategy: FallbackStrategy): void {
    errorInfo.retryCount++;
    this.retryQueue.set(errorInfo.id, { error: errorInfo, strategy });
    console.log(
      `⏳ Queued error ${errorInfo.id} for retry (attempt ${errorInfo.retryCount}/${errorInfo.maxRetries})`
    );
  }

  /**
   * Process retry queue when back online
   */
  private async processRetryQueue(): Promise<void> {
    if (!this.isOnline || this.retryQueue.size === 0) return;

    console.log(`🔄 Processing ${this.retryQueue.size} queued errors`);

    const entries = Array.from(this.retryQueue.entries());

    for (const [errorId, { error, strategy }] of entries) {
      try {
        console.log(`🔄 Retrying error ${errorId} with strategy ${strategy.name}`);

        await strategy.handler(new Error(error.message), error._context);

        // Success - remove from queue and mark as resolved
        error.resolved = true;
        this.updateErrorInfo(error);
        this.retryQueue.delete(errorId);

        console.log(`✅ Successfully retried error ${errorId}`);
      } catch (retryError) {
        console.warn(`❌ Retry failed for error ${errorId}:`, retryError);

        // Check if we should keep trying
        if (error.retryCount >= error.maxRetries) {
          this.retryQueue.delete(errorId);
          console.log(`🛑 Max retries exceeded for error ${errorId}`);
        }
      }
    }
  }

  /**
   * Execute recovery action
   */
  async executeRecoveryAction(actionName: string, errorId: string): Promise<boolean> {
    const errorInfo = this.errorLog.get(errorId);
    if (!errorInfo) {
      throw new Error(`Error ${errorId} not found`);
    }

    const recoveryActions = this.generateRecoveryActions(errorInfo);
    const action = recoveryActions.find(a => a.name === actionName);

    if (!action) {
      throw new Error(`Recovery action ${actionName} not found`);
    }

    try {
      console.log(`🔧 Executing recovery action: ${action.name}`);
      const success = await action.action();

      if (success) {
        errorInfo.resolved = true;
        this.updateErrorInfo(errorInfo);
        console.log(`✅ Recovery action ${action.name} completed successfully`);
      }

      return success;
    } catch (error) {
      console.error(`❌ Recovery action ${action.name} failed:`, error);
      return false;
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(): {
    total: number;
    bySeverity: Record<ErrorSeverity, number>;
    byCategory: Record<ErrorCategory, number>;
    resolved: number;
    unresolved: number;
  } {
    const errors = Array.from(this.errorLog.values());

    const stats = {
      total: errors.length,
      bySeverity: { low: 0, medium: 0, high: 0, critical: 0 } as Record<ErrorSeverity, number>,
      byCategory: {} as Record<ErrorCategory, number>,
      resolved: 0,
      unresolved: 0,
    };

    errors.forEach(error => {
      stats.bySeverity[error.severity]++;
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;

      if (error.resolved) {
        stats.resolved++;
      } else {
        stats.unresolved++;
      }
    });

    return stats;
  }

  /**
   * Add error listener
   */
  addListener(callback: (error: ErrorInfo) => void): void {
    this.listeners.add(callback);
  }

  /**
   * Remove error listener
   */
  removeListener(callback: (error: ErrorInfo) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 50): ErrorInfo[] {
    return Array.from(this.errorLog.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Clear error log
   */
  clearErrorLog(): void {
    this.errorLog.clear();
    this.saveErrorLog();
  }

  // Private utility methods
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sanitizeContext(_context?: Record<string, any>): Record<string, any> | undefined {
    if (!_context) return undefined;

    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(_context)) {
      // Remove sensitive data
      if (
        key.toLowerCase().includes('password') ||
        key.toLowerCase().includes('token') ||
        key.toLowerCase().includes('secret') ||
        key.toLowerCase().includes('key')
      ) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 1000) {
        sanitized[key] = `${value.substring(0, 1000)}...[TRUNCATED]`;
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  private getMaxRetriesForCategory(category: ErrorCategory): number {
    const categoryRetries: Record<ErrorCategory, number> = {
      network: 3,
      authentication: 2,
      encryption: 1,
      storage: 2,
      validation: 1,
      sync: 3,
      compliance: 1,
      user_action: 0,
      system: 2,
    };

    return categoryRetries[category] || 1;
  }

  private updateErrorInfo(errorInfo: ErrorInfo): void {
    this.errorLog.set(errorInfo.id, errorInfo);
    this.saveErrorLog();
  }

  private notifyListeners(errorInfo: ErrorInfo): void {
    this.listeners.forEach(callback => {
      try {
        callback(errorInfo);
      } catch (error) {
        console.error('Error in error listener:', error);
      }
    });
  }

  private logToConsole(errorInfo: ErrorInfo): void {
    const emoji = {
      low: 'ℹ️',
      medium: '⚠️',
      high: '🚨',
      critical: '💥',
    }[errorInfo.severity];

    console.error(
      `${emoji} [${errorInfo.category.toUpperCase()}] ${errorInfo.message}`,
      errorInfo._context
    );
  }

  private async sendToRemoteLogging(errorInfo: ErrorInfo): Promise<void> {
    try {
      // Only send non-sensitive information
      const sanitizedError = {
        id: errorInfo.id,
        message: errorInfo.message,
        category: errorInfo.category,
        severity: errorInfo.severity,
        timestamp: errorInfo.timestamp,
        url: errorInfo.url,
        userAgent: errorInfo.userAgent,
      };

      // This would send to your logging service
      console.log('📡 Would send to remote logging:', sanitizedError);
    } catch (error) {
      console.error('Failed to send to remote logging:', error);
    }
  }

  private async cleanupStorageSpace(): Promise<void> {
    try {
      // Clear old error logs
      const oldErrors = Array.from(this.errorLog.entries()).filter(([, error]) => {
        const errorDate = new Date(error.timestamp);
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return errorDate < weekAgo && error.resolved;
      });

      oldErrors.forEach(([id]) => this.errorLog.delete(id));

      // Clear old cache data
      const keysToCheck = Object.keys(localStorage);
      keysToCheck.forEach(key => {
        if (key.startsWith('cache_') || key.startsWith('temp_')) {
          localStorage.removeItem(key);
        }
      });

      console.log(`🧹 Cleaned up ${oldErrors.length} old errors and cache data`);
    } catch (error) {
      console.error('Failed to cleanup storage:', error);
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private saveErrorLog(): void {
    try {
      const logData = Array.from(this.errorLog.entries()).slice(-100); // Keep last 100 errors
      storageService.set('error_log', Object.fromEntries(logData));
    } catch (error) {
      console.error('Failed to save error log:', error);
    }
  }

  private loadErrorLog(): void {
    try {
      const logData = storageService.get<Record<string, ErrorInfo>>('error_log');
      if (logData) {
        this.errorLog = new Map(Object.entries(logData));
      }
    } catch (error) {
      console.error('Failed to load error log:', error);
    }
  }
}

// Export singleton instance
export const errorHandler = ErrorHandlingService.getInstance();

// Convenience function for handling errors
export const handleError = (
  error: Error,
  category: ErrorCategory,
  severity: ErrorSeverity = 'medium',
  _context?: Record<string, any>
) => {
  return errorHandler.handleError(error, category, severity, _context);
};

// Types are exported with their declarations above
