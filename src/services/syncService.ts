// src/services/syncService.ts
import { supabase } from '../utils/supabase';
import { dataService } from './dataService';
import { encryptionService } from './encryptionService';
import * as storageService from './storageService';

// Browser-compatible timer type
type TimerHandle = ReturnType<typeof setTimeout>;

/**
 * Offline-first sync service with conflict resolution
 * Handles synchronization between local and remote data with encryption
 * Designed for healthcare applications requiring high data integrity
 */

export interface SyncConflict {
  key: string;
  table: string;
  localData: any;
  remoteData: any;
  localTimestamp: string;
  remoteTimestamp: string;
  conflictType: 'update' | 'delete' | 'concurrent_edit';
}

export interface SyncResult {
  success: string[];
  failed: Array<{ key: string; error: string }>;
  conflicts: SyncConflict[];
  totalSynced: number;
  lastSyncTime: string;
  syncDuration: number;
}

export interface SyncSettings {
  autoSync: boolean;
  syncInterval: number; // milliseconds
  conflictResolution: 'local_wins' | 'remote_wins' | 'manual' | 'latest_timestamp';
  maxRetries: number;
  batchSize: number;
  healthcareDataPriority: boolean; // Prioritize healthcare data in sync
}

export type SyncStatus = 'idle' | 'syncing' | 'conflict' | 'error' | 'offline';

export class SyncService {
  private static instance: SyncService;
  private syncSettings: SyncSettings;
  private syncStatus: SyncStatus = 'idle';
  private lastSyncTime: Date | null = null;
  private syncTimer: TimerHandle | null = null;
  private isOnline: boolean = navigator.onLine;
  private pendingConflicts: Map<string, SyncConflict> = new Map();
  private listeners: Set<(status: SyncStatus, conflicts?: SyncConflict[]) => void> = new Set();

  private constructor() {
    this.syncSettings = this.loadSyncSettings();
    this.initializeNetworkListeners();
    this.initializeAutoSync();
  }

  public static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService();
    }
    return SyncService.instance;
  }

  /**
   * Initialize network change listeners
   */
  private initializeNetworkListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners('idle');
      if (this.syncSettings.autoSync) {
        this.performSync();
      }
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners('offline');
      this.stopAutoSync();
    });
  }

  /**
   * Initialize automatic sync timer
   */
  private initializeAutoSync(): void {
    if (this.syncSettings.autoSync && this.isOnline) {
      this.syncTimer = setInterval(() => {
        this.performSync();
      }, this.syncSettings.syncInterval);
    }
  }

  /**
   * Start automatic synchronization
   */
  startAutoSync(): void {
    this.syncSettings.autoSync = true;
    this.saveSyncSettings();
    this.initializeAutoSync();
  }

  /**
   * Stop automatic synchronization
   */
  stopAutoSync(): void {
    this.syncSettings.autoSync = false;
    this.saveSyncSettings();
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
      this.syncTimer = null;
    }
  }

  /**
   * Perform full synchronization
   */
  async performSync(userId?: string): Promise<SyncResult> {
    if (!this.isOnline) {
      throw new Error('Cannot sync while offline');
    }

    if (this.syncStatus === 'syncing') {
      throw new Error('Sync already in progress');
    }

    const startTime = Date.now();
    this.syncStatus = 'syncing';
    this.notifyListeners('syncing');

    try {
      // Get current user ID
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const currentUserId = userId || user?.id;

      if (!currentUserId) {
        throw new Error('No authenticated user found');
      }

      // Step 1: Process offline changes queue
      await this.processOfflineQueue(currentUserId);

      // Step 2: Sync each data type
      const syncResult = await this.syncAllDataTypes(currentUserId);

      // Step 3: Handle conflicts if any
      if (syncResult.conflicts.length > 0) {
        this.pendingConflicts.clear();
        syncResult.conflicts.forEach(conflict => {
          this.pendingConflicts.set(conflict.key, conflict);
        });

        this.syncStatus = 'conflict';
        this.notifyListeners('conflict', syncResult.conflicts);
      } else {
        this.syncStatus = 'idle';
        this.notifyListeners('idle');
      }

      this.lastSyncTime = new Date();
      this.saveSyncState(currentUserId);

      const syncDuration = Date.now() - startTime;

      return {
        ...syncResult,
        syncDuration,
        lastSyncTime: this.lastSyncTime.toISOString(),
      };
    } catch (error) {
      this.syncStatus = 'error';
      this.notifyListeners('error');

      console.error('Sync failed:', error);
      throw error;
    }
  }

  /**
   * Sync all data types with conflict detection
   */
  private async syncAllDataTypes(
    userId: string
  ): Promise<Omit<SyncResult, 'syncDuration' | 'lastSyncTime'>> {
    const dataTypes = [
      'username',
      'points',
      'favorites',
      'goals',
      'achievements',
      'skills',
      'skillsList',
      'calendarNotes',
      'symptoms',
      'wordFiles',
    ];

    // Prioritize healthcare data if setting is enabled
    const prioritizedTypes = this.syncSettings.healthcareDataPriority
      ? this.prioritizeHealthcareData(dataTypes)
      : dataTypes;

    const results: SyncResult = {
      success: [],
      failed: [],
      conflicts: [],
      totalSynced: 0,
      syncDuration: 0,
      lastSyncTime: '',
    };

    // Process in batches
    for (let i = 0; i < prioritizedTypes.length; i += this.syncSettings.batchSize) {
      const batch = prioritizedTypes.slice(i, i + this.syncSettings.batchSize);

      await Promise.all(
        batch.map(async dataType => {
          try {
            const result = await this.syncDataType(dataType, userId);

            if (result.conflict) {
              results.conflicts.push(result.conflict);
            } else {
              results.success.push(dataType);
              results.totalSynced++;
            }
          } catch (error) {
            results.failed.push({
              key: dataType,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        })
      );
    }

    return results;
  }

  /**
   * Sync individual data type with conflict detection
   */
  private async syncDataType(
    dataType: string,
    userId: string
  ): Promise<{
    success: boolean;
    conflict?: SyncConflict;
  }> {
    try {
      // Get local data and timestamp
      const localData = storageService.get(dataType);
      const localTimestampRaw = storageService.get(`${dataType}_timestamp`);
      const localTimestamp =
        typeof localTimestampRaw === 'string' ? localTimestampRaw : new Date(0).toISOString();

      // Get remote data and timestamp
      const remoteData = await this.getRemoteData(dataType, userId);
      const remoteTimestamp = await this.getRemoteTimestamp(dataType, userId);

      // No local data, just pull remote
      if (localData === null) {
        if (remoteData !== null) {
          await dataService.setData(dataType, remoteData, userId);
          storageService.set(`${dataType}_timestamp`, remoteTimestamp);
        }
        return { success: true };
      }

      // No remote data, push local
      if (remoteData === null) {
        await dataService.setData(dataType, localData, userId);
        storageService.set(`${dataType}_timestamp`, new Date().toISOString());
        return { success: true };
      }

      // Both exist - check for conflicts
      const conflict = this.detectConflict(
        dataType,
        localData,
        remoteData,
        localTimestamp,
        remoteTimestamp
      );

      if (conflict) {
        // Handle automatic resolution based on settings
        if (this.syncSettings.conflictResolution !== 'manual') {
          const resolved = await this.resolveConflict(conflict, userId);
          if (resolved) {
            return { success: true };
          }
        }
        return { success: false, conflict };
      }

      // No conflict - check if sync needed
      if (localTimestamp < remoteTimestamp) {
        // Remote is newer, pull
        await this.pullData(dataType, remoteData, remoteTimestamp);
      } else if (localTimestamp > remoteTimestamp) {
        // Local is newer, push
        await this.pushData(dataType, localData, userId);
      }

      return { success: true };
    } catch (error) {
      console.error(`Failed to sync ${dataType}:`, error);
      throw error;
    }
  }

  /**
   * Detect conflicts between local and remote data
   */
  private detectConflict(
    key: string,
    localData: any,
    remoteData: any,
    localTimestamp: string,
    remoteTimestamp: string
  ): SyncConflict | null {
    // Simple conflict detection - data differs and both have been modified
    const dataHash = (data: any) => JSON.stringify(data);

    if (dataHash(localData) !== dataHash(remoteData)) {
      const localTime = new Date(localTimestamp);
      const remoteTime = new Date(remoteTimestamp);

      // Check if timestamps are close (concurrent edit)
      const timeDiff = Math.abs(localTime.getTime() - remoteTime.getTime());
      const conflictType = timeDiff < 60000 ? 'concurrent_edit' : 'update'; // 1 minute threshold

      return {
        key,
        table: this.getTableName(key),
        localData,
        remoteData,
        localTimestamp,
        remoteTimestamp,
        conflictType,
      };
    }

    return null;
  }

  /**
   * Resolve conflict automatically based on settings
   */
  private async resolveConflict(conflict: SyncConflict, userId: string): Promise<boolean> {
    try {
      let winningData: any;
      let winningTimestamp: string;

      switch (this.syncSettings.conflictResolution) {
        case 'local_wins':
          winningData = conflict.localData;
          winningTimestamp = conflict.localTimestamp;
          break;

        case 'remote_wins':
          winningData = conflict.remoteData;
          winningTimestamp = conflict.remoteTimestamp;
          break;

        case 'latest_timestamp': {
          const localTime = new Date(conflict.localTimestamp);
          const remoteTime = new Date(conflict.remoteTimestamp);

          if (localTime >= remoteTime) {
            winningData = conflict.localData;
            winningTimestamp = conflict.localTimestamp;
          } else {
            winningData = conflict.remoteData;
            winningTimestamp = conflict.remoteTimestamp;
          }
          break;
        }

        default:
          return false; // Manual resolution required
      }

      // Apply the winning data both locally and remotely
      await dataService.setData(conflict.key, winningData, userId);
      storageService.set(`${conflict.key}_timestamp`, winningTimestamp);

      return true;
    } catch (error) {
      console.error(`Failed to resolve conflict for ${conflict.key}:`, error);
      return false;
    }
  }

  /**
   * Manually resolve a specific conflict
   */
  async resolveConflictManually(
    conflictKey: string,
    resolution: 'use_local' | 'use_remote' | 'merge',
    mergedData?: any
  ): Promise<boolean> {
    const conflict = this.pendingConflicts.get(conflictKey);
    if (!conflict) {
      throw new Error(`No pending conflict found for key: ${conflictKey}`);
    }

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let finalData: any;
      const timestamp = new Date().toISOString();

      switch (resolution) {
        case 'use_local':
          finalData = conflict.localData;
          break;
        case 'use_remote':
          finalData = conflict.remoteData;
          break;
        case 'merge':
          if (!mergedData) {
            throw new Error('Merged data required for merge resolution');
          }
          finalData = mergedData;
          break;
      }

      // Apply the resolution
      await dataService.setData(conflict.key, finalData, user.id);
      storageService.set(`${conflict.key}_timestamp`, timestamp);

      // Remove from pending conflicts
      this.pendingConflicts.delete(conflictKey);

      // Update status if no more conflicts
      if (this.pendingConflicts.size === 0) {
        this.syncStatus = 'idle';
        this.notifyListeners('idle');
      }

      return true;
    } catch (error) {
      console.error(`Failed to manually resolve conflict for ${conflictKey}:`, error);
      return false;
    }
  }

  /**
   * Get all pending conflicts
   */
  getPendingConflicts(): SyncConflict[] {
    return Array.from(this.pendingConflicts.values());
  }

  /**
   * Process offline changes queue
   */
  private async processOfflineQueue(userId: string): Promise<void> {
    const { data: offlineChanges, error } = await supabase
      .from('offline_changes_queue')
      .select('*')
      .eq('user_id', userId)
      .eq('processed', false)
      .order('queued_at', { ascending: true });

    if (error) {
      console.error('Failed to fetch offline changes:', error);
      return;
    }

    for (const change of offlineChanges || []) {
      try {
        const decryptedData = encryptionService.decrypt(change.encrypted_data, userId);

        switch (change.operation) {
          case 'insert':
          case 'update':
            await dataService.setData(
              change.table_name.replace('user_', ''),
              decryptedData,
              userId
            );
            break;
          case 'delete':
            await dataService.removeData(change.table_name.replace('user_', ''), userId);
            break;
        }

        // Mark as processed
        await supabase
          .from('offline_changes_queue')
          .update({ processed: true, processed_at: new Date().toISOString() })
          .eq('id', change.id);
      } catch (error) {
        console.error(`Failed to process offline change ${change.id}:`, error);

        // Update error message
        await supabase
          .from('offline_changes_queue')
          .update({ error_message: error instanceof Error ? error.message : String(error) })
          .eq('id', change.id);
      }
    }
  }

  /**
   * Add status change listener
   */
  addListener(callback: (status: SyncStatus, conflicts?: SyncConflict[]) => void): void {
    this.listeners.add(callback);
  }

  /**
   * Remove status change listener
   */
  removeListener(callback: (status: SyncStatus, conflicts?: SyncConflict[]) => void): void {
    this.listeners.delete(callback);
  }

  /**
   * Get current sync status
   */
  getSyncStatus(): SyncStatus {
    return this.syncStatus;
  }

  /**
   * Get last sync time
   */
  getLastSyncTime(): Date | null {
    return this.lastSyncTime;
  }

  /**
   * Update sync settings
   */
  updateSyncSettings(settings: Partial<SyncSettings>): void {
    this.syncSettings = { ...this.syncSettings, ...settings };
    this.saveSyncSettings();

    // Restart auto sync if settings changed
    if (settings.autoSync !== undefined || settings.syncInterval !== undefined) {
      this.stopAutoSync();
      if (this.syncSettings.autoSync) {
        this.initializeAutoSync();
      }
    }
  }

  /**
   * Get current sync settings
   */
  getSyncSettings(): SyncSettings {
    return { ...this.syncSettings };
  }

  // Private utility methods
  private async getRemoteData(key: string, userId: string): Promise<any> {
    try {
      return await dataService.getData(key, userId);
    } catch (error) {
      console.error(`Failed to get remote data for ${key}:`, error);
      return null;
    }
  }

  private async getRemoteTimestamp(key: string, userId: string): Promise<string> {
    try {
      const tableName = this.getTableName(key);
      const { data, error } = await supabase
        .from('sync_status')
        .select('last_sync_at')
        .eq('user_id', userId)
        .eq('table_name', tableName)
        .single();

      if (error || !data) {
        return new Date(0).toISOString();
      }

      return data.last_sync_at;
    } catch (error) {
      return new Date(0).toISOString();
    }
  }

  private async pullData(key: string, data: any, timestamp: string): Promise<void> {
    storageService.set(key, data);
    storageService.set(`${key}_timestamp`, timestamp);
  }

  private async pushData(key: string, data: any, userId: string): Promise<void> {
    await dataService.setData(key, data, userId);
    storageService.set(`${key}_timestamp`, new Date().toISOString());
  }

  private getTableName(key: string): string {
    const tableMap: Record<string, string> = {
      goals: 'user_goals',
      achievements: 'user_achievements',
      skills: 'user_skills',
      skillsList: 'user_skills',
      calendarNotes: 'user_calendar_notes',
      symptoms: 'user_symptoms',
      wordFiles: 'user_word_files',
      username: 'user_profiles',
      favorites: 'user_profiles',
      points: 'user_profiles',
    };
    return tableMap[key] || 'user_profiles';
  }

  private prioritizeHealthcareData(dataTypes: string[]): string[] {
    const healthcareTypes = ['symptoms', 'calendarNotes', 'goals'];
    const regularTypes = dataTypes.filter(type => !healthcareTypes.includes(type));
    return [...healthcareTypes.filter(type => dataTypes.includes(type)), ...regularTypes];
  }

  private notifyListeners(status: SyncStatus, conflicts?: SyncConflict[]): void {
    this.listeners.forEach(callback => {
      try {
        callback(status, conflicts);
      } catch (error) {
        console.error('Error in sync listener:', error);
      }
    });
  }

  private loadSyncSettings(): SyncSettings {
    const defaults: SyncSettings = {
      autoSync: true,
      syncInterval: 300000, // 5 minutes
      conflictResolution: 'latest_timestamp',
      maxRetries: 3,
      batchSize: 5,
      healthcareDataPriority: true,
    };

    const stored = storageService.get<Partial<SyncSettings>>('sync_settings');
    return { ...defaults, ...stored };
  }

  private saveSyncSettings(): void {
    storageService.set('sync_settings', this.syncSettings);
  }

  private saveSyncState(userId: string): void {
    const state = {
      lastSyncTime: this.lastSyncTime?.toISOString(),
      userId,
      pendingConflicts: this.pendingConflicts.size,
    };
    storageService.set('sync_state', state);
  }
}

// Export singleton instance
export const syncService = SyncService.getInstance();

// Types are exported with their declarations above
