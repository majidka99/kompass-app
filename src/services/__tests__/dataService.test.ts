// src/services/__tests__/dataService.test.ts
import { beforeEach, describe, expect, it } from 'vitest';
import { dataService } from '../dataService';
import { encryptionService } from '../encryptionService';

/**
 * Basic smoke tests for the dataService implementation
 * These tests verify the core functionality works without requiring Supabase setup
 */

describe('DataService', () => {
  const testUserId = 'test-user-123';

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.clear();
  });

  describe('Data Processing Service (Server-Side Encryption)', () => {
    it('should process data correctly (no client-side encryption)', async () => {
      const testData = { message: 'Hello Healthcare!', sensitive: true };

      const processed = encryptionService.encrypt(testData, testUserId);
      expect(processed).toBeDefined();
      expect(typeof processed).toBe('string');
      // Data is now JSON, not encrypted on client
      expect(processed).toContain('Hello Healthcare!');

      const parsed = encryptionService.decrypt(await processed, testUserId);
      expect(parsed).toEqual(testData);
    });

    it('should handle metadata (server-side encryption mode)', () => {
      const metadata = encryptionService.getEncryptionMetadata();

      expect(metadata).toHaveProperty('algorithm');
      expect(metadata.algorithm).toBe('NONE-SERVER-SIDE-ONLY');
      expect(metadata).toHaveProperty('keySize');
      expect(metadata.keySize).toBe(0);
      expect(metadata).toHaveProperty('deviceFingerprint');
      expect(metadata.deviceFingerprint).toBe('NO-CLIENT-SIDE-FINGERPRINT');
    });

    it('should pass data processing test', () => {
      const testResult = encryptionService.testEncryption(testUserId);
      expect(testResult).toBe(true);
    });
  });

  describe('Data Service - Offline Mode', () => {
    beforeEach(() => {
      // Simulate offline mode for these tests
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false,
      });
    });

    it('should handle basic data operations when offline', async () => {
      const testGoals = [
        { id: '1', title: 'Test Goal 1', text: 'Description 1', completed: false },
        { id: '2', title: 'Test Goal 2', text: 'Description 2', completed: true },
      ];

      // Set data (should use localStorage when offline)
      await dataService.setData('goals', testGoals, testUserId);

      // Get data back (should retrieve from localStorage)
      const retrievedGoals = await dataService.getData('goals', testUserId);

      expect(retrievedGoals).toEqual(testGoals);
    });

    it('should handle different data types when offline', async () => {
      const testCases = [
        { key: 'username', value: 'testuser' },
        { key: 'points', value: 150 },
        { key: 'favorites', value: ['home', 'skills', 'guide'] },
        {
          key: 'achievements',
          value: [{ id: 'ach1', title: 'First Achievement', date: '2024-01-01' }],
        },
      ];

      // Test each data type individually
      for (const { key, value } of testCases) {
        await dataService.setData(key, value, testUserId);
        const retrieved = await dataService.getData(key, testUserId);
        expect(retrieved).toEqual(value);
      }
    });

    it('should handle data removal when offline', async () => {
      const testData = { test: 'value' };

      await dataService.setData('test', testData, testUserId);
      let retrieved = await dataService.getData('test', testUserId);
      expect(retrieved).toEqual(testData);

      await dataService.removeData('test', testUserId);
      retrieved = await dataService.getData('test', testUserId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Data Service - Error Handling', () => {
    it('should handle invalid data gracefully', async () => {
      // This shouldn't throw an error
      await expect(dataService.getData('nonexistent', testUserId)).resolves.toBeNull();
    });

    it('should handle null values correctly', async () => {
      await dataService.setData('nullTest', null, testUserId);
      const retrieved = await dataService.getData('nullTest', testUserId);
      expect(retrieved).toBeNull();
    });
  });

  describe('Sync Status', () => {
    it('should provide sync functionality interface', async () => {
      // Test that the methods exist and don't throw
      const testData = [{ id: '1', value: 'test' }];

      await dataService.setData('testSync', testData, testUserId);

      // These might not work without Supabase but shouldn't throw
      expect(typeof dataService.syncAllData).toBe('function');
      expect(typeof dataService.getSyncStatus).toBe('function');
      expect(typeof dataService.testEncryption).toBe('function');
      expect(typeof dataService.getEncryptionMetadata).toBe('function');
    });
  });
});
