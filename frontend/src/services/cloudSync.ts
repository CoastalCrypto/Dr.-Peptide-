import { Storage, KEYS } from '../utils/storage';
import { api } from '../utils/api';

/**
 * CloudSyncService handles bidirectional sync between local storage and MongoDB
 * When a user is authenticated, their data is synced to the cloud for backup
 */
export const CloudSyncService = {
  /**
   * Sync all local data to the cloud (for backup)
   */
  syncToCloud: async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Gather all local data
      const recurringItems = await Storage.get<any[]>(KEYS.RECURRING_ITEMS) || [];
      const journalEntries = await Storage.get<any[]>(KEYS.JOURNAL_ENTRIES) || [];
      const calculatorPresets = await Storage.get<any[]>(KEYS.CALCULATOR_PRESETS) || [];
      const customPeptides = await Storage.get<any[]>(KEYS.CUSTOM_PEPTIDES) || [];
      const customMeds = await Storage.get<any[]>(KEYS.CUSTOM_MEDS) || [];
      const vendors = await Storage.get<any[]>('peptrack_vendors') || [];
      const orders = await Storage.get<any[]>('peptrack_orders') || [];
      const injectionSites = await Storage.get<any>(KEYS.INJECTION_SITES) || {};
      const settings = await Storage.get<any>(KEYS.SETTINGS) || {};
      const goals = await Storage.get<string[]>(KEYS.GOALS) || [];

      // Send to backend
      const response = await api.post('/api/sync/backup', {
        user_id: userId,
        data: {
          recurring_items: recurringItems,
          journal_entries: journalEntries,
          calculator_presets: calculatorPresets,
          custom_peptides: customPeptides,
          custom_medications: customMeds,
          vendors,
          orders,
          injection_sites: injectionSites,
          settings,
          goals,
          last_sync: new Date().toISOString(),
        },
      });

      return { success: true };
    } catch (error: any) {
      console.error('Sync to cloud failed:', error);
      return { success: false, error: error.message || 'Sync failed' };
    }
  },

  /**
   * Restore data from cloud to local storage
   */
  syncFromCloud: async (userId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await api.get(`/api/sync/restore/${userId}`);
      
      if (response.data) {
        const { data } = response;
        
        // Restore each data type to local storage
        if (data.recurring_items?.length) {
          await Storage.set(KEYS.RECURRING_ITEMS, data.recurring_items);
        }
        if (data.journal_entries?.length) {
          await Storage.set(KEYS.JOURNAL_ENTRIES, data.journal_entries);
        }
        if (data.calculator_presets?.length) {
          await Storage.set(KEYS.CALCULATOR_PRESETS, data.calculator_presets);
        }
        if (data.custom_peptides?.length) {
          await Storage.set(KEYS.CUSTOM_PEPTIDES, data.custom_peptides);
        }
        if (data.custom_medications?.length) {
          await Storage.set(KEYS.CUSTOM_MEDS, data.custom_medications);
        }
        if (data.vendors?.length) {
          await Storage.set('peptrack_vendors', data.vendors);
        }
        if (data.orders?.length) {
          await Storage.set('peptrack_orders', data.orders);
        }
        if (data.injection_sites && Object.keys(data.injection_sites).length) {
          await Storage.set(KEYS.INJECTION_SITES, data.injection_sites);
        }
        if (data.settings && Object.keys(data.settings).length) {
          await Storage.set(KEYS.SETTINGS, data.settings);
        }
        if (data.goals?.length) {
          await Storage.set(KEYS.GOALS, data.goals);
        }
      }

      return { success: true };
    } catch (error: any) {
      console.error('Sync from cloud failed:', error);
      return { success: false, error: error.message || 'Restore failed' };
    }
  },

  /**
   * Get sync status/info
   */
  getSyncInfo: async (userId: string): Promise<{ lastSync: string | null; hasCloudData: boolean }> => {
    try {
      const response = await api.get(`/api/sync/status/${userId}`);
      return {
        lastSync: response.last_sync || null,
        hasCloudData: response.has_data || false,
      };
    } catch (error) {
      return { lastSync: null, hasCloudData: false };
    }
  },

  /**
   * Merge cloud data with local data (for conflict resolution)
   * Uses "latest wins" strategy based on timestamps
   */
  mergeData: async (userId: string): Promise<{ success: boolean; merged: number }> => {
    try {
      const response = await api.get(`/api/sync/restore/${userId}`);
      let mergedCount = 0;

      if (response.data) {
        const cloudData = response.data;
        
        // Merge recurring items (keep both, dedupe by item_id)
        const localItems = await Storage.get<any[]>(KEYS.RECURRING_ITEMS) || [];
        const cloudItems = cloudData.recurring_items || [];
        const mergedItems = CloudSyncService.mergeByKey(localItems, cloudItems, 'item_id');
        await Storage.set(KEYS.RECURRING_ITEMS, mergedItems);
        mergedCount += mergedItems.length - localItems.length;

        // Merge journal entries (keep both, dedupe by entry_id or date)
        const localJournal = await Storage.get<any[]>(KEYS.JOURNAL_ENTRIES) || [];
        const cloudJournal = cloudData.journal_entries || [];
        const mergedJournal = CloudSyncService.mergeByKey(localJournal, cloudJournal, 'entry_id', 'date');
        await Storage.set(KEYS.JOURNAL_ENTRIES, mergedJournal);
        mergedCount += mergedJournal.length - localJournal.length;

        // Merge calculator presets
        const localPresets = await Storage.get<any[]>(KEYS.CALCULATOR_PRESETS) || [];
        const cloudPresets = cloudData.calculator_presets || [];
        const mergedPresets = CloudSyncService.mergeByKey(localPresets, cloudPresets, 'preset_id', 'name');
        await Storage.set(KEYS.CALCULATOR_PRESETS, mergedPresets);
        mergedCount += mergedPresets.length - localPresets.length;
      }

      // After merge, backup the merged data
      await CloudSyncService.syncToCloud(userId);

      return { success: true, merged: mergedCount };
    } catch (error: any) {
      console.error('Merge failed:', error);
      return { success: false, merged: 0 };
    }
  },

  /**
   * Helper to merge arrays by a key field, with optional secondary key
   */
  mergeByKey: (local: any[], cloud: any[], primaryKey: string, secondaryKey?: string): any[] => {
    const merged = [...local];
    const existingKeys = new Set(local.map(item => 
      item[primaryKey] || (secondaryKey ? item[secondaryKey] : null)
    ));

    for (const cloudItem of cloud) {
      const key = cloudItem[primaryKey] || (secondaryKey ? cloudItem[secondaryKey] : null);
      if (key && !existingKeys.has(key)) {
        merged.push(cloudItem);
        existingKeys.add(key);
      }
    }

    return merged;
  },

  /**
   * Clear all cloud data for a user (for account deletion)
   */
  clearCloudData: async (userId: string): Promise<boolean> => {
    try {
      await api.delete(`/api/sync/clear/${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to clear cloud data:', error);
      return false;
    }
  },
};
