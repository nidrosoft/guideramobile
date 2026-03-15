/**
 * SAFETY NOTIFICATIONS
 *
 * Threshold-based push notifications for safety alerts.
 * Different notification styles per risk level.
 * Uses expo-notifications (already in project).
 */

import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { SafetyZoneResult, SafetyLevel } from './types/safety.types';

/**
 * Send a safety push notification based on the risk assessment.
 * Only fires for caution+ levels. Critical gets urgent treatment.
 */
export async function sendSafetyNotification(result: SafetyZoneResult): Promise<void> {
  try {
    const { level, summary, alerts } = result;

    // Don't notify for safe zones
    if (level === 'safe') return;

    const config = getNotificationConfig(level);

    // Haptic feedback for high/critical
    if (level === 'high' || level === 'critical') {
      Haptics.notificationAsync(
        level === 'critical'
          ? Haptics.NotificationFeedbackType.Error
          : Haptics.NotificationFeedbackType.Warning
      );
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title: config.title,
        body: summary,
        data: {
          type: 'safety_alert',
          level,
          score: result.score,
          alerts: alerts.slice(0, 3).map(a => ({ id: a.id, title: a.title, type: a.type })),
          actionUrl: '/community/safety',
        },
        sound: config.sound,
        priority: config.priority as any,
        categoryIdentifier: 'safety',
      },
      trigger: null, // Immediate
    });

  } catch (e) {
    console.warn('Safety notification error:', e);
  }
}

interface NotificationConfig {
  title: string;
  sound: boolean;
  priority: string;
}

function getNotificationConfig(level: SafetyLevel): NotificationConfig {
  switch (level) {
    case 'caution':
      return {
        title: '🟡 Safety Notice',
        sound: false,
        priority: 'default',
      };
    case 'high':
      return {
        title: '🔴 Safety Warning',
        sound: true,
        priority: 'high',
      };
    case 'critical':
      return {
        title: '🚨 DANGER ALERT',
        sound: true,
        priority: 'max',
      };
    default:
      return {
        title: 'Safety Update',
        sound: false,
        priority: 'low',
      };
  }
}
