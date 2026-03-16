/**
 * SCAN BOTTOM SHEET
 * 
 * Quick actions bottom sheet for AR/Scan features
 * Shows available camera-based actions before opening the camera
 */

import { View, Text, StyleSheet, TouchableOpacity, Modal } from 'react-native';
import { useState } from 'react';
import * as Haptics from 'expo-haptics';
import { typography, spacing, borderRadius } from '@/styles';
import { useTheme } from '@/context/ThemeContext';
import { 
  Scan, 
  LanguageSquare, 
  Map1, 
  Receipt1, 
  CloseCircle,
  Danger,
  MessageQuestion,
  Routing2,
} from 'iconsax-react-native';

// Action types for the scan feature - maps to AR plugin IDs
export type ScanActionType = 
  | 'navigate'
  | 'landmark-scanner' 
  | 'menu-translator' 
  | 'airport-navigator'
  | 'danger-alerts'
  | 'city-navigator'
  | 'receipt'
  | 'scan-document'
  | 'ask-ai';

interface ScanAction {
  id: ScanActionType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  comingSoon?: boolean; // For features not yet implemented
}

const SCAN_ACTIONS: ScanAction[] = [
  {
    id: 'navigate',
    title: 'Navigate',
    description: 'City, airport & landmark navigation',
    icon: <Routing2 size={24} color="#7C3AED" variant="Bold" />,
    color: '#7C3AED',
    bgColor: '#7C3AED15',
  },
  {
    id: 'menu-translator',
    title: 'AI Vision',
    description: 'Translate signs, menus & build orders',
    icon: <LanguageSquare size={24} color="#EC4899" variant="Bold" />,
    color: '#EC4899',
    bgColor: '#EC489915',
  },
  {
    id: 'danger-alerts',
    title: 'Safety Alerts',
    description: 'Get real-time danger warnings',
    icon: <Danger size={24} color="#EF4444" variant="Bold" />,
    color: '#EF4444',
    bgColor: '#EF444415',
  },
  {
    id: 'receipt',
    title: 'Scan Receipt',
    description: 'Track your travel expenses',
    icon: <Receipt1 size={24} color="#22C55E" variant="Bold" />,
    color: '#22C55E',
    bgColor: '#22C55E15',
  },
  {
    id: 'scan-document',
    title: 'Scan or Upload Ticket',
    description: 'Import boarding pass, voucher, or confirmation',
    icon: <Scan size={24} color="#3B82F6" variant="Bold" />,
    color: '#3B82F6',
    bgColor: '#3B82F615',
  },
  {
    id: 'ask-ai',
    title: 'Ask Guidera AI',
    description: 'Get instant travel answers',
    icon: <MessageQuestion size={24} color="#3FC39E" variant="Bold" />,
    color: '#3FC39E',
    bgColor: '#3FC39E15',
  },
];

interface ScanBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAction: (action: ScanActionType) => void;
}

export default function ScanBottomSheet({ 
  visible, 
  onClose, 
  onSelectAction 
}: ScanBottomSheetProps) {
  const { colors, isDark } = useTheme();
  const [selectedAction, setSelectedAction] = useState<ScanActionType | null>(null);

  const handleSelectAction = (action: ScanAction) => {
    // Don't proceed if coming soon
    if (action.comingSoon) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedAction(action.id);
    
    // Small delay for visual feedback before closing
    setTimeout(() => {
      onClose();
      onSelectAction(action.id);
      setSelectedAction(null);
    }, 150);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.backdrop} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        <View style={[styles.bottomSheet, { backgroundColor: isDark ? '#1A1A1A' : colors.bgElevated }]}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.gray300 }]} />
          </View>

          {/* Close Button */}
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <CloseCircle size={32} color={colors.gray400} variant="Bold" />
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Quick Actions</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Explore the world through your camera</Text>
          </View>

          {/* Actions List */}
          <View style={styles.actionsList}>
            {SCAN_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionItem,
                  selectedAction === action.id && styles.actionItemSelected,
                  action.comingSoon && styles.actionItemDisabled,
                ]}
                onPress={() => handleSelectAction(action)}
                activeOpacity={action.comingSoon ? 1 : 0.7}
              >
                {/* Icon with colored ring and soft background */}
                <View style={[
                  styles.iconRing, 
                  { borderColor: action.color, backgroundColor: action.bgColor },
                  action.comingSoon && styles.iconRingDisabled,
                ]}>
                  {action.icon}
                </View>
                
                {/* Text content */}
                <View style={styles.actionContent}>
                  <View style={styles.titleRow}>
                    <Text style={[
                      styles.actionTitle,
                      { color: colors.textPrimary },
                      action.comingSoon && { color: colors.gray400 },
                    ]}>
                      {action.title}
                    </Text>
                    {action.comingSoon && (
                      <View style={[styles.comingSoonBadge, { backgroundColor: colors.bgSecondary }]}>
                        <Text style={[styles.comingSoonText, { color: colors.textTertiary }]}>Coming Soon</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[
                    styles.actionDescription,
                    { color: colors.textSecondary },
                    action.comingSoon && { color: colors.gray300 },
                  ]}>
                    {action.description}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  bottomSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    zIndex: 10,
    padding: spacing.xs,
  },
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
  },
  actionsList: {
    paddingHorizontal: spacing.xl,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  actionItemSelected: {
    opacity: 0.6,
  },
  iconRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 2,
  },
  actionDescription: {
    fontSize: typography.fontSize.sm,
  },
  actionItemDisabled: {
    opacity: 0.7,
  },
  iconRingDisabled: {
    opacity: 0.5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  comingSoonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  comingSoonText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
});
