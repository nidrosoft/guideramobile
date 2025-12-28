/**
 * OTA Update Service
 * 
 * Handles over-the-air updates using expo-updates:
 * - Check for updates
 * - Download and apply updates
 * - Force update for critical versions
 * - Rollback support
 */

import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '@/services/logging';

const STORAGE_KEYS = {
  LAST_CHECK: '@guidera_update_last_check',
  SKIPPED_VERSION: '@guidera_update_skipped',
  WHATS_NEW_SEEN: '@guidera_whats_new_seen',
};

// Minimum time between update checks (1 hour)
const MIN_CHECK_INTERVAL = 60 * 60 * 1000;

interface UpdateInfo {
  isAvailable: boolean;
  manifest?: Updates.Manifest;
  isRequired?: boolean;
}

class UpdateService {
  private static instance: UpdateService;
  private isChecking: boolean = false;

  private constructor() {}

  static getInstance(): UpdateService {
    if (!UpdateService.instance) {
      UpdateService.instance = new UpdateService();
    }
    return UpdateService.instance;
  }

  /**
   * Check if updates are enabled
   */
  isEnabled(): boolean {
    return !__DEV__ && Updates.isEnabled;
  }

  /**
   * Get current update info
   */
  getCurrentUpdate(): {
    updateId: string | null;
    channel: string | null;
    createdAt: Date | null;
  } {
    return {
      updateId: Updates.updateId,
      channel: Updates.channel,
      createdAt: Updates.createdAt,
    };
  }

  /**
   * Check for available updates
   */
  async checkForUpdate(force = false): Promise<UpdateInfo> {
    if (!this.isEnabled()) {
      logger.debug('Updates not enabled (dev mode)');
      return { isAvailable: false };
    }

    if (this.isChecking) {
      logger.debug('Update check already in progress');
      return { isAvailable: false };
    }

    // Rate limit checks
    if (!force) {
      const lastCheck = await AsyncStorage.getItem(STORAGE_KEYS.LAST_CHECK);
      if (lastCheck) {
        const elapsed = Date.now() - parseInt(lastCheck, 10);
        if (elapsed < MIN_CHECK_INTERVAL) {
          logger.debug('Skipping update check (too recent)');
          return { isAvailable: false };
        }
      }
    }

    this.isChecking = true;

    try {
      logger.info('Checking for updates...');
      const update = await Updates.checkForUpdateAsync();
      
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_CHECK, Date.now().toString());

      if (update.isAvailable) {
        logger.info('Update available', { 
          updateId: update.manifest?.id 
        });

        // Check if this version was skipped
        const skippedVersion = await AsyncStorage.getItem(STORAGE_KEYS.SKIPPED_VERSION);
        if (skippedVersion === update.manifest?.id && !force) {
          logger.debug('Update was previously skipped');
          return { isAvailable: false };
        }

        // Check if update is required (critical)
        const isRequired = this.isRequiredUpdate(update.manifest);

        return {
          isAvailable: true,
          manifest: update.manifest,
          isRequired,
        };
      }

      logger.debug('No updates available');
      return { isAvailable: false };
    } catch (error) {
      logger.error('Failed to check for updates', error);
      return { isAvailable: false };
    } finally {
      this.isChecking = false;
    }
  }

  /**
   * Download and apply update
   */
  async downloadAndApply(): Promise<boolean> {
    if (!this.isEnabled()) {
      return false;
    }

    try {
      logger.info('Downloading update...');
      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        logger.info('Update downloaded, reloading app...');
        await Updates.reloadAsync();
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to download update', error);
      return false;
    }
  }

  /**
   * Show update prompt to user
   */
  async promptForUpdate(updateInfo: UpdateInfo): Promise<void> {
    const { isRequired, manifest } = updateInfo;

    if (isRequired) {
      // Force update - no option to skip
      Alert.alert(
        'Update Required',
        'A critical update is available. Please update to continue using the app.',
        [
          {
            text: 'Update Now',
            onPress: () => this.downloadAndApply(),
          },
        ],
        { cancelable: false }
      );
    } else {
      // Optional update
      Alert.alert(
        'Update Available',
        'A new version of Guidera is available. Would you like to update now?',
        [
          {
            text: 'Later',
            style: 'cancel',
            onPress: () => this.skipUpdate(manifest?.id),
          },
          {
            text: 'Update',
            onPress: () => this.downloadAndApply(),
          },
        ]
      );
    }
  }

  /**
   * Skip this update version
   */
  async skipUpdate(updateId?: string): Promise<void> {
    if (updateId) {
      await AsyncStorage.setItem(STORAGE_KEYS.SKIPPED_VERSION, updateId);
      logger.info('Update skipped', { updateId });
    }
  }

  /**
   * Check if "What's New" has been seen for current version
   */
  async hasSeenWhatsNew(): Promise<boolean> {
    const seenVersion = await AsyncStorage.getItem(STORAGE_KEYS.WHATS_NEW_SEEN);
    return seenVersion === Updates.updateId;
  }

  /**
   * Mark "What's New" as seen
   */
  async markWhatsNewSeen(): Promise<void> {
    if (Updates.updateId) {
      await AsyncStorage.setItem(STORAGE_KEYS.WHATS_NEW_SEEN, Updates.updateId);
    }
  }

  /**
   * Get release notes for current update
   */
  getReleaseNotes(): string[] {
    // In a real app, this would come from the manifest metadata
    // For now, return placeholder
    return [
      'Bug fixes and performance improvements',
      'New features and enhancements',
    ];
  }

  /**
   * Check on app start (background check)
   */
  async checkOnStart(): Promise<void> {
    if (!this.isEnabled()) return;

    try {
      const updateInfo = await this.checkForUpdate();
      
      if (updateInfo.isAvailable) {
        if (updateInfo.isRequired) {
          // Force update immediately
          this.promptForUpdate(updateInfo);
        } else {
          // Optional: Show update prompt or just log
          logger.info('Optional update available');
        }
      }
    } catch (error) {
      logger.error('Background update check failed', error);
    }
  }

  // ==================== Private Methods ====================

  /**
   * Determine if update is required (critical)
   */
  private isRequiredUpdate(manifest?: Updates.Manifest): boolean {
    // Check manifest metadata for required flag
    // This would be set in app.json or eas.json
    const metadata = (manifest as any)?.metadata;
    return metadata?.required === true || metadata?.critical === true;
  }
}

// Export singleton instance
export const updateService = UpdateService.getInstance();

// Export convenience functions
export const checkForUpdate = (force?: boolean) => updateService.checkForUpdate(force);
export const downloadUpdate = () => updateService.downloadAndApply();
export const promptUpdate = (info: UpdateInfo) => updateService.promptForUpdate(info);
export const getCurrentUpdateInfo = () => updateService.getCurrentUpdate();

export default updateService;
