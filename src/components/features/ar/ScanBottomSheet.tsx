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
  Building,
  CloseCircle,
  Airplane,
  Danger
} from 'iconsax-react-native';

// Action types for the scan feature - maps to AR plugin IDs
export type ScanActionType = 
  | 'landmark-scanner' 
  | 'menu-translator' 
  | 'airport-navigator'
  | 'danger-alerts'
  | 'city-navigator'
  | 'receipt'
  | 'scan-document';

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
    id: 'landmark-scanner',
    title: 'AR Explore',
    description: 'Discover landmarks around you',
    icon: <Building size={24} color="#7C3AED" variant="Bold" />,
    color: '#7C3AED', // Purple
    bgColor: '#7C3AED15', // Soft purple
  },
  {
    id: 'menu-translator',
    title: 'Translate Text',
    description: 'Point at signs or menus',
    icon: <LanguageSquare size={24} color="#EC4899" variant="Bold" />,
    color: '#EC4899', // Pink
    bgColor: '#EC489915', // Soft pink
  },
  {
    id: 'airport-navigator',
    title: 'Airport Navigator',
    description: 'Navigate terminals & gates',
    icon: <Airplane size={24} color="#F97316" variant="Bold" />,
    color: '#F97316', // Orange
    bgColor: '#F9731615', // Soft orange
  },
  {
    id: 'danger-alerts',
    title: 'Safety Alerts',
    description: 'Get real-time danger warnings',
    icon: <Danger size={24} color="#EF4444" variant="Bold" />,
    color: '#EF4444', // Red
    bgColor: '#EF444415', // Soft red
  },
  {
    id: 'city-navigator',
    title: 'City Navigator',
    description: 'Get walking directions',
    icon: <Map1 size={24} color="#EAB308" variant="Bold" />,
    color: '#EAB308', // Yellow
    bgColor: '#EAB30815', // Soft yellow
  },
  {
    id: 'receipt',
    title: 'Scan Receipt',
    description: 'Track your travel expenses',
    icon: <Receipt1 size={24} color="#22C55E" variant="Bold" />,
    color: '#22C55E', // Green
    bgColor: '#22C55E15', // Soft green
  },
  {
    id: 'scan-document',
    title: 'Scan Document',
    description: 'Import tickets or bookings',
    icon: <Scan size={24} color="#3B82F6" variant="Bold" />,
    color: '#3B82F6', // Blue
    bgColor: '#3B82F615', // Soft blue
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
